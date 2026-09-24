import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, afterEach, it, expect } from 'vitest';
import { patchFromVersion } from '../scripts/collector/saveMatch';
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  for (const name of [
    '001_tft_meta_schema',
    '002_tft_collector_rpc',
    '003_tft_collector_diagnostics',
    '004_tft_nullable_patch',
    '005_tft_meta_views',
    '008_tft_meta_performance',
    '009_tft_meta_retention',
  ])
    await db.exec(readFileSync(`supabase/migrations/${name}.sql`, 'utf8'));
}, 30000);
afterAll(async () => db?.close());
beforeEach(async () => {
  await db.exec('BEGIN');
});
afterEach(async () => {
  await db.exec('ROLLBACK');
});
async function value<T = any>(sql: string, params: unknown[] = []): Promise<T> {
  const result = await db.query<{ value: T }>(sql, params);
  return result.rows[0]!.value;
}
async function seed(
  patch: string | null,
  count: number,
  ageDays = 0,
  prefix = 'test',
  collectionAge = ageDays,
) {
  await db.query(
    `INSERT INTO public.tft_matches(match_id,game_datetime,game_version,patch,queue_id,collected_at,ingestion_complete,completed_at)
   SELECT $1||g, (extract(epoch FROM(now()-make_interval(days=>$3::int)-interval '1 minute'))*1000)::bigint,
   coalesce('Version '||$2||'.123','TFT Unreal Version ?.?.?.?'),$2,1100,now()-make_interval(days=>$5::int)-interval '1 minute',true,now()
   FROM generate_series(1,$4::int) g`,
    [prefix, patch, ageDays, count, collectionAge],
  );
  await db.exec(`INSERT INTO public.tft_players(puuid) SELECT 'p'||g FROM generate_series(1,8) g ON CONFLICT DO NOTHING;
   INSERT INTO public.tft_participants(match_id,puuid,placement,level,last_round)
   SELECT m.match_id,'p'||g,g,8,30 FROM public.tft_matches m CROSS JOIN generate_series(1,8) g
   ON CONFLICT DO NOTHING;
   INSERT INTO public.tft_units(participant_id,unit_index,character_id,tier,rarity)
   SELECT participant_id,0,'unit-'||m.patch,2,1 FROM public.tft_participants p JOIN public.tft_matches m USING(match_id)
   WHERE m.patch IS NOT NULL ON CONFLICT DO NOTHING;
   INSERT INTO public.tft_unit_items(unit_id,item_index,item_name) SELECT unit_id,0,'item' FROM public.tft_units ON CONFLICT DO NOTHING;
   INSERT INTO public.tft_traits(participant_id,name,num_units,tier_current,tier_total)
   SELECT participant_id,'trait',2,1,3 FROM public.tft_participants ON CONFLICT DO NOTHING;`);
}
const refresh = () => value('SELECT public.refresh_tft_meta_stats() AS value');
async function enable() {
  await db.exec('UPDATE public.tft_meta_state SET cleanup_enabled=true');
}
const clean = (g: number, batch = 200) =>
  value('SELECT public.cleanup_tft_meta_data($1,$2) AS value', [g, batch]);
it('initial migration has empty state and cleanup disabled; no deletion', async () => {
  expect(await value('SELECT cleanup_enabled AS value FROM public.tft_meta_state')).toBe(false);
  expect(await clean(0)).toMatchObject({ status: 'disabled' });
});
it('existing parser drives confirmation; unknown string remains unknown', () => {
  expect(patchFromVersion('Linux Version 16.20.123 release')).toBe('16.20');
  expect(patchFromVersion('TFT Unreal Version ?.?.?.?')).toBeNull();
});
it('insufficient sample never confirms even with unanimous patch', async () => {
  await seed('16.19', 29);
  expect(await refresh()).toMatchObject({
    current: null,
    candidate: '16.19',
    sampleSize: 29,
    confirmed: false,
    matchCount: 0,
  });
});
it('90 percent threshold counts unknown patches in denominator', async () => {
  await seed('16.19', 89);
  await seed(null, 11, 0, 'unknown');
  expect(await refresh()).toMatchObject({ current: null, ratio: 0.89, confirmed: false });
});
it('exact threshold confirms, subsequent same patch is maintained', async () => {
  await seed('16.19', 90);
  await seed(null, 10, 0, 'unknown');
  expect(await refresh()).toMatchObject({
    current: '16.19',
    ratio: 0.9,
    confirmed: true,
    matchCount: 90,
  });
  expect(await refresh()).toMatchObject({ current: '16.19', confirmed: false });
});
it('one newer patch cannot switch; current patch never moves backwards', async () => {
  await seed('16.19', 99);
  await seed('16.20', 1, 0, 'new');
  await refresh();
  expect(await value('SELECT current_patch AS value FROM public.tft_meta_state')).toBe('16.19');
  await db.exec("UPDATE public.tft_meta_state SET current_patch='16.21'");
  expect(await refresh()).toMatchObject({ current: '16.21', confirmed: false });
});
it('new patch takeover and all four aggregates exclude older/null/expired matches', async () => {
  await db.exec("UPDATE public.tft_meta_state SET current_patch='16.19'");
  await seed('16.20', 90);
  await seed('16.19', 9, 0, 'old');
  await seed(null, 1, 0, 'unknown');
  await seed('16.20', 2, 8, 'expired');
  await seed('16.20', 1, 8, 'late-import', 0);
  const r = await refresh();
  expect(r).toMatchObject({ current: '16.20', confirmed: true, matchCount: 90 });
  expect(await value('SELECT match_count AS value FROM public.mv_tft_meta_summary')).toBe(90);
  expect(await value('SELECT sample_count AS value FROM public.mv_tft_item_stats')).toBe(720);
  expect(
    await value('SELECT array_agg(character_id) AS value FROM public.mv_tft_champion_stats'),
  ).toEqual(['unit-16.20']);
  expect(await value('SELECT sample_count AS value FROM public.mv_tft_trait_stats')).toBe(720);
  expect(await value('SELECT count(*) AS value FROM public.tft_matches')).toBe(103); // Refresh does not delete.
  await enable();
  expect(await clean(r.generation)).toMatchObject({
    oldPatchMatches: 10,
    expiredMatches: 3,
    deletedMatches: 13,
  });
  expect(await value('SELECT count(*) AS value FROM public.tft_matches')).toBe(90);
  expect(await value('SELECT count(*) AS value FROM public.tft_participants')).toBe(720);
  expect(await value('SELECT count(*) AS value FROM public.tft_units')).toBe(720);
  expect(await value('SELECT count(*) AS value FROM public.tft_unit_items')).toBe(720);
  expect(await value('SELECT count(*) AS value FROM public.tft_traits')).toBe(720);
});
it('collection-age expiry works even when game time is recent; batches are bounded', async () => {
  await seed('16.19', 30);
  await seed('16.19', 5, 0, 'old-collection', 8);
  const r = await refresh();
  await enable();
  expect(await clean(r.generation, 2)).toMatchObject({ deletedMatches: 2, expiredMatches: 2 });
  expect(await clean(r.generation, 200)).toMatchObject({ deletedMatches: 3 });
  expect(await value('SELECT count(*) AS value FROM public.tft_matches')).toBe(30);
});
it('unknown primary source gives empty meta and safe age-only retention', async () => {
  await seed(null, 40);
  await seed(null, 2, 8, 'old');
  const r = await refresh();
  await enable();
  expect(r).toMatchObject({ current: null, matchCount: 0 });
  expect(await clean(r.generation)).toMatchObject({ deletedMatches: 2, oldPatchMatches: 0 });
  expect(await value('SELECT count(*) AS value FROM public.tft_matches')).toBe(40);
});
it('candidate evidence survives cleanup and prevents duplicate observation weighting', async () => {
  await db.exec("UPDATE public.tft_meta_state SET current_patch='16.19'");
  await seed('16.19', 90);
  await seed('16.20', 10, 0, 'new');
  const r = await refresh();
  await enable();
  await clean(r.generation);
  expect(
    await value('SELECT jsonb_array_length(observations) AS value FROM public.tft_meta_state'),
  ).toBe(100);
  expect(
    await value("SELECT count(*) AS value FROM public.tft_meta_existing_matches(ARRAY['new1'])"),
  ).toBe(1);
  expect(await refresh()).toMatchObject({ sampleSize: 100, candidateCount: 90 });
});
it('stale generation cannot delete', async () => {
  await seed('16.19', 30);
  const r = await refresh();
  await enable();
  await expect(clean(r.generation - 1)).rejects.toThrow('Fresh verified');
});
it('refresh verification failure rolls back state and preserves previous aggregate', async () => {
  await seed('16.19', 30);
  await refresh();
  await db.exec(
    'SAVEPOINT broken; DELETE FROM public.tft_participants WHERE participant_id=(SELECT min(participant_id) FROM public.tft_participants)',
  );
  await expect(refresh()).rejects.toThrow('verification failed');
  await db.exec('ROLLBACK TO SAVEPOINT broken');
  expect(await value('SELECT participant_count AS value FROM public.mv_tft_meta_summary')).toBe(
    240,
  );
});
it('anonymous/authenticated cannot execute maintenance or access state', async () => {
  for (const role of ['anon', 'authenticated']) {
    expect(
      await value(
        "SELECT has_function_privilege($1,'public.cleanup_tft_meta_data(bigint,integer)','EXECUTE') AS value",
        [role],
      ),
    ).toBe(false);
    expect(
      await value(
        "SELECT has_function_privilege($1,'public.refresh_tft_meta_stats()','EXECUTE') AS value",
        [role],
      ),
    ).toBe(false);
    expect(
      await value("SELECT has_table_privilege($1,'public.tft_meta_state','SELECT') AS value", [
        role,
      ]),
    ).toBe(false);
  }
  await db.exec('SET LOCAL ROLE service_role');
  expect(await refresh()).toMatchObject({ status: 'refreshed' });
});
it('successive small candidate batches confirm after their raw boards were cleaned', async () => {
  await seed('16.19', 100, 1, 'old');
  await refresh();
  await enable();
  for (let batch = 1; batch <= 3; batch++) {
    await seed('16.20', 30, 0, `candidate-${batch}-`);
    const r = await refresh();
    expect(r.current).toBe(batch < 3 ? '16.19' : '16.20');
    expect(r.sampleSize).toBe(100);
    await clean(r.generation);
  }
  expect(await value('SELECT count(*) AS value FROM public.tft_matches')).toBe(30);
  expect(await value('SELECT count(*) AS value FROM public.mv_tft_champion_stats')).toBe(1);
});
it('time window keeps boundary exactly seven days old and rejects one millisecond older', async () => {
  await seed('16.19', 30);
  await refresh();
  await db.exec(`UPDATE public.tft_meta_state SET window_end=now();
    UPDATE public.tft_matches SET collected_at=now()-interval '7 days',
    game_datetime=(extract(epoch FROM(now()-interval '7 days'))*1000)::bigint WHERE match_id='test1';
    UPDATE public.tft_matches SET collected_at=now()-interval '7 days 0.001 seconds' WHERE match_id='test2';`);
  expect(
    await value("SELECT count(*) AS value FROM public.v_tft_meta_scope WHERE match_id='test1'"),
  ).toBe(1);
  expect(
    await value("SELECT count(*) AS value FROM public.v_tft_meta_scope WHERE match_id='test2'"),
  ).toBe(0);
});
