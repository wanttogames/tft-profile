-- Requires 001..004. All collected, complete KR ranked matches; no patch filter.
BEGIN;
CREATE VIEW public.v_tft_meta_participants WITH (security_invoker=true) AS
SELECT p.* FROM public.tft_participants p JOIN public.tft_matches m USING(match_id)
WHERE m.ingestion_complete AND m.platform='kr' AND m.queue_id=1100;

CREATE VIEW public.v_tft_meta_equipment WITH (security_invoker=true) AS
SELECT DISTINCT p.participant_id,u.character_id,i.item_name
FROM public.v_tft_meta_participants p JOIN public.tft_units u USING(participant_id)
JOIN public.tft_unit_items i USING(unit_id);

CREATE VIEW public.v_tft_item_stats WITH (security_invoker=true) AS
WITH usage AS (
 SELECT DISTINCT participant_id,item_name FROM public.v_tft_meta_equipment
), stats AS (
 SELECT item_name,count(*) AS sample_count,avg(p.placement) AS avg_placement,
 avg((p.placement<=4)::int) AS top4_rate,avg((p.placement=1)::int) AS win_rate
 FROM usage JOIN public.v_tft_meta_participants p USING(participant_id) GROUP BY item_name
), pairs AS (
 SELECT item_name,character_id,count(*) AS sample_count FROM public.v_tft_meta_equipment GROUP BY item_name,character_id
), ranked AS (
 SELECT *,row_number() OVER(PARTITION BY item_name ORDER BY sample_count DESC,character_id) AS rn FROM pairs
), common AS (
 SELECT item_name,jsonb_agg(jsonb_build_object('id',character_id,'sample_count',sample_count) ORDER BY sample_count DESC,character_id) AS common_champions
 FROM ranked WHERE rn<=5 GROUP BY item_name
)
SELECT s.*,coalesce(c.common_champions,'[]'::jsonb) AS common_champions FROM stats s LEFT JOIN common c USING(item_name);

CREATE VIEW public.v_tft_champion_stats WITH (security_invoker=true) AS
WITH usage AS (
 -- Average duplicate copies within one board first: each participant contributes one sample.
 SELECT participant_id,character_id,avg(tier) AS board_star_level
 FROM public.tft_units JOIN public.v_tft_meta_participants USING(participant_id) GROUP BY participant_id,character_id
), stats AS (
 SELECT character_id,count(*) AS sample_count,avg(p.placement) AS avg_placement,
 avg((p.placement<=4)::int) AS top4_rate,avg((p.placement=1)::int) AS win_rate,avg(board_star_level) AS avg_star_level
 FROM usage JOIN public.v_tft_meta_participants p USING(participant_id) GROUP BY character_id
), pairs AS (
 SELECT character_id,item_name,count(*) AS sample_count FROM public.v_tft_meta_equipment GROUP BY character_id,item_name
), ranked AS (
 SELECT *,row_number() OVER(PARTITION BY character_id ORDER BY sample_count DESC,item_name) AS rn FROM pairs
), common AS (
 SELECT character_id,jsonb_agg(jsonb_build_object('id',item_name,'sample_count',sample_count) ORDER BY sample_count DESC,item_name) AS common_items
 FROM ranked WHERE rn<=5 GROUP BY character_id
)
SELECT s.*,coalesce(c.common_items,'[]'::jsonb) AS common_items FROM stats s LEFT JOIN common c USING(character_id);

CREATE VIEW public.v_tft_trait_stats WITH (security_invoker=true) AS
WITH usage AS (
 SELECT p.participant_id,p.placement,t.name AS trait_name,t.tier_current
 FROM public.v_tft_meta_participants p JOIN public.tft_traits t USING(participant_id) WHERE t.tier_current>0
), counts AS (
 SELECT trait_name,tier_current,count(*) AS sample_count FROM usage GROUP BY trait_name,tier_current
), tiers AS (
 SELECT trait_name,jsonb_agg(jsonb_build_object('tier_current',tier_current,'sample_count',sample_count) ORDER BY tier_current) AS tier_samples
 FROM counts GROUP BY trait_name
)
SELECT trait_name,count(*) AS sample_count,avg(placement) AS avg_placement,
 avg((placement<=4)::int) AS top4_rate,avg((placement=1)::int) AS win_rate,avg(tier_current) AS avg_tier_current,tiers.tier_samples
FROM usage JOIN tiers USING(trait_name) GROUP BY trait_name,tiers.tier_samples;

CREATE VIEW public.v_tft_meta_summary WITH (security_invoker=true) AS
SELECT (SELECT count(*) FROM public.tft_matches WHERE ingestion_complete AND platform='kr' AND queue_id=1100) AS match_count,
 count(*) AS participant_count,count(DISTINCT puuid) AS player_count,
 (SELECT max(collected_at) FROM public.tft_matches WHERE ingestion_complete AND platform='kr' AND queue_id=1100) AS latest_collected_at
FROM public.v_tft_meta_participants;

-- Server-only views; clients receive aggregate results through a Netlify Function.
DO $$
DECLARE v text; r text;
BEGIN
 FOREACH v IN ARRAY ARRAY['v_tft_meta_participants','v_tft_meta_equipment','v_tft_item_stats','v_tft_champion_stats','v_tft_trait_stats','v_tft_meta_summary'] LOOP
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC',v);
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON public.%I FROM %I',v,r); END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN EXECUTE format('GRANT SELECT ON public.%I TO service_role',v); END IF;
 END LOOP;
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
