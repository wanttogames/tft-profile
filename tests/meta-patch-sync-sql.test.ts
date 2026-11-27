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
    '013_tft_meta_patch_sync',
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


const patchUrl=(patch:string)=>'https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-'+patch.replace('.','-');
const sync=(patch='18.7',days=5,calendar=true)=>value(
  "SELECT public.sync_tft_patch_calendar($1,$2,now()-make_interval(days=>$3::int),CASE WHEN $4::boolean THEN ((now()-make_interval(days=>$3::int)) AT TIME ZONE 'America/Los_Angeles')::date END,CASE WHEN $4::boolean THEN ((now()-make_interval(days=>$3::int)) AT TIME ZONE 'America/Los_Angeles')::date+14 END) AS value",
  [patch,patchUrl(patch),days,calendar]);
it('independent registration works with zero matches, rechecks preserve first observation',async()=>{
  expect(await sync()).toMatchObject({status:'registered',detectedPatch:'18.7',basis:'schedule-estimate',expectedSet:18});
  const first=await value("SELECT first_seen_at AS value FROM public.tft_patch_calendar");
  expect(await sync('18.7',5,false)).toMatchObject({basis:'schedule-estimate'});
  expect(await value("SELECT first_seen_at AS value FROM public.tft_patch_calendar")).toEqual(first);
  expect(await refresh()).toMatchObject({matchCount:0,externalSampleSize:0});
});
it('late detection recovers 10 past matches, then promotes at 30 without changing raw patch',async()=>{
  await seed(null,10);
  await db.exec("UPDATE public.tft_matches SET set_number=18; UPDATE public.tft_meta_state SET current_patch='18.4',patch_source='official'");
  await sync();
  expect(await refresh()).toMatchObject({current:'18.4',previewPatch:'18.7',previewSetNumber:18,externalSampleSize:10,matchCount:10,confirmed:false,boundaryBasis:'schedule-estimate'});
  await seed(null,20,0,'more');
  await db.exec('UPDATE public.tft_matches SET set_number=18');
  expect(await refresh()).toMatchObject({current:'18.7',previewPatch:null,externalSampleSize:30,matchCount:30,confirmed:true,boundaryBasis:'schedule-estimate'});
  expect(await value("SELECT count(patch) AS value FROM public.tft_matches")).toBe(0);
});
it('wrong set cannot confirm even with 30 eligible boards',async()=>{
  await seed(null,30);
  await db.exec('UPDATE public.tft_matches SET set_number=17');
  await sync();
  expect(await refresh()).toMatchObject({current:null,externalSampleSize:0,previewPatch:null,confirmed:false,calendarConflicts:30});
});
it('no schedule or verified boundary cannot confirm unknown versions',async()=>{
  await seed(null,30);
  await db.exec('UPDATE public.tft_matches SET set_number=18');
  await sync('18.7',5,false);
  expect(await refresh()).toMatchObject({current:null,previewPatch:null,previewSetNumber:18,confirmed:false,boundaryBasis:'first-observed'});
});
it('new set must wait for 48-hour guard, old interval closes, old source ignored',async()=>{
  await sync('18.7',5);
  await sync('19.1',0);
  expect(await sync('18.7',5)).toMatchObject({status:'older-source-ignored'});
  expect(await value("SELECT count(*) AS value FROM public.tft_patch_calendar")).toBe(2);
  expect(await value("SELECT next_cutoff_at IS NOT NULL AS value FROM public.tft_patch_calendar WHERE patch='18.7'")).toBe(true);
  await seed(null,30);
  await db.exec("UPDATE public.tft_matches SET set_number=19");
  expect(await refresh()).toMatchObject({current:null,externalSampleSize:0,previewPatch:null,confirmed:false});
});
it('verified owner boundary overrides estimate and cannot be invoked by service role',async()=>{
  await seed(null,10);
  await db.exec('UPDATE public.tft_matches SET set_number=18');
  await sync('18.7',1);
  expect(await refresh()).toMatchObject({externalSampleSize:0});
  expect(await value("SELECT has_function_privilege('service_role','public.set_tft_verified_kr_boundary(text,timestamptz,text)','EXECUTE') AS value")).toBe(false);
  expect(await value("SELECT public.set_tft_verified_kr_boundary('18.7',now()-interval '2 hours','https://example.test/verified') AS value")).toMatchObject({status:'registered'});
  expect(await refresh()).toMatchObject({externalSampleSize:10,previewPatch:'18.7',boundaryBasis:'verified'});
  expect(await value("SELECT verification_url AS value FROM public.tft_patch_calendar WHERE patch='18.7'")).toBe('https://example.test/verified');
});
it('retention removes expired unknown boards but keeps recent pre-boundary boards',async()=>{
  await seed(null,10);
  await seed(null,2,8,'expired');
  await db.exec('UPDATE public.tft_matches SET set_number=18');
  await sync();
  const r=await refresh();
  await enable();
  expect(await clean(r.generation)).toMatchObject({deletedMatches:2,expiredMatches:2});
  expect(await value('SELECT count(*) AS value FROM public.tft_matches')).toBe(10);
});
