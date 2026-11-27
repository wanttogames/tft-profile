import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, afterEach, it, expect } from 'vitest';
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
    '010_tft_meta_official_patch',
    '011_tft_meta_keep_external_boundary',
    '012_tft_meta_recovery',
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

const url='https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-18-7';
const register=()=>value("SELECT public.register_tft_external_patch('18.7',$1,now()-interval '2 days') AS value",[url]);
it('10 saved pre-boundary boards become preview only and survive cleanup',async()=>{
 await seed(null,10);
 await db.exec("UPDATE public.tft_matches SET set_number=18; UPDATE public.tft_meta_state SET current_patch='18.4',patch_source='official'");
 await register();
 const r=await refresh();
 expect(r).toMatchObject({current:'18.4',confirmed:false,matchCount:10,storedMatchCount:10,unresolvedMatchCount:10,previewSetNumber:18,confirmedMatchCount:0,externalSampleSize:0});
 expect(await value('SELECT count(patch) AS value FROM public.tft_matches')).toBe(0);
 expect(await value('SELECT confirmed_match_count AS value FROM public.v_tft_meta_current_summary')).toBe(0);
 await enable();
 expect(await clean(r.generation)).toMatchObject({deletedMatches:0});
});
it('reports eligible counts under 30 and transitions to verified scope at 30',async()=>{
 await seed(null,10);
 await db.exec('UPDATE public.tft_matches SET set_number=18');
 await register();
 await db.exec("UPDATE public.tft_meta_state SET external_boundary_at=now()-interval '2 minutes'");
 expect(await refresh()).toMatchObject({externalSampleSize:10,previewSetNumber:18,confirmed:false});
 await seed(null,20,0,'more');
 await db.exec('UPDATE public.tft_matches SET set_number=18');
 expect(await refresh()).toMatchObject({current:'18.7',confirmed:true,matchCount:30,confirmedMatchCount:30,previewSetNumber:null,externalSampleSize:30});
 expect(await value('SELECT count(patch) AS value FROM public.tft_matches')).toBe(0);
});
it('rejects mixed sets in preview',async()=>{
 await seed(null,10);
 await db.exec("UPDATE public.tft_matches SET set_number=18; UPDATE public.tft_matches SET set_number=17 WHERE match_id='test1'");
 await register();
 expect(await refresh()).toMatchObject({matchCount:0,storedMatchCount:10,previewSetNumber:null});
});
it('confirmed scope takes priority over preview',async()=>{
 await seed(null,10);
 await db.exec("UPDATE public.tft_matches SET set_number=18");
 await register();
 await seed('18.4',5,0,'known');
 await db.exec("UPDATE public.tft_meta_state SET current_patch='18.4',patch_source='match'");
 expect(await refresh()).toMatchObject({matchCount:5,storedMatchCount:15,previewSetNumber:null,confirmedMatchCount:5});
});
it('operator boundary is audited and service role cannot override',async()=>{
 await seed(null,10);
 await db.exec('UPDATE public.tft_matches SET set_number=18');
 await register();
 expect(await value("SELECT has_function_privilege('service_role','public.set_tft_verified_kr_boundary(text,timestamptz,text)','EXECUTE') AS value")).toBe(false);
 expect(await value("SELECT public.set_tft_verified_kr_boundary('18.7',now()-interval '2 minutes','https://example.test/verified') AS value")).toMatchObject({status:'registered'});
 expect(await refresh()).toMatchObject({externalSampleSize:10});
 expect(await value('SELECT external_boundary_evidence AS value FROM public.tft_meta_state')).toBe('https://example.test/verified');
});
