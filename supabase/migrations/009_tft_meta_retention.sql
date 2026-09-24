-- Apply AFTER 008. No raw deletion or aggregate rebuild during migration.
BEGIN;
CREATE TABLE public.tft_meta_state (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 current_patch text CHECK(current_patch ~ '^[0-9]+\.[0-9]+$'),
 detected_patch text,
 detected_at timestamptz,
 confirmed_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 confirm_sample_size integer NOT NULL DEFAULT 100 CHECK(confirm_sample_size BETWEEN 30 AND 100),
 confirm_min_samples integer NOT NULL DEFAULT 30 CHECK(confirm_min_samples BETWEEN 30 AND confirm_sample_size),
 confirm_ratio numeric NOT NULL DEFAULT .90 CHECK(confirm_ratio BETWEEN .90 AND 1),
 -- Bounded detection evidence, not historical statistics; contains no PUUID.
 observations jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_array_length(observations)<=100),
 retention_days integer NOT NULL DEFAULT 7 CHECK(retention_days=7),
 window_end timestamptz,
 refreshed_at timestamptz,
 generation bigint NOT NULL DEFAULT 0,
 cleanup_enabled boolean NOT NULL DEFAULT false
);
INSERT INTO public.tft_meta_state(singleton) VALUES(true);
ALTER TABLE public.tft_meta_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tft_meta_state FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.tft_meta_state TO service_role;
-- Existing FK/unique prefixes cover all cascade joins. Only missing root access paths.
CREATE INDEX tft_matches_retention_idx ON public.tft_matches(collected_at,match_id);
CREATE INDEX tft_matches_patch_window_idx ON public.tft_matches(patch,collected_at)
 WHERE ingestion_complete AND platform='kr' AND queue_id=1100;

-- Both collection age and actual match age must be recent. A newly imported old
-- match must never re-enter the current meta. A fixed batch cutoff keeps all MVs coherent.
CREATE VIEW public.v_tft_meta_scope WITH (security_invoker=true) AS
 SELECT m.* FROM public.tft_matches m CROSS JOIN public.tft_meta_state s
 WHERE m.ingestion_complete AND m.platform='kr' AND m.queue_id=1100
 AND m.patch=s.current_patch
 AND m.collected_at BETWEEN s.window_end-interval '7 days' AND s.window_end
 AND m.game_datetime BETWEEN extract(epoch FROM(s.window_end-interval '7 days'))*1000
                         AND extract(epoch FROM s.window_end)*1000;
CREATE OR REPLACE VIEW public.v_tft_meta_participants WITH (security_invoker=true) AS
 SELECT p.* FROM public.tft_participants p JOIN public.v_tft_meta_scope m USING(match_id);
CREATE OR REPLACE VIEW public.v_tft_meta_summary WITH (security_invoker=true) AS
 SELECT (SELECT count(*) FROM public.v_tft_meta_scope) AS match_count,
 count(*) AS participant_count,count(DISTINCT puuid) AS player_count,
 (SELECT max(collected_at) FROM public.v_tft_meta_scope) AS latest_collected_at
 FROM public.v_tft_meta_participants;
-- Metadata describes the committed aggregate, never a speculative candidate.
CREATE VIEW public.v_tft_meta_current_summary WITH (security_invoker=true) AS
 SELECT CASE WHEN s.refreshed_at IS NULL THEN 0 ELSE m.match_count END AS match_count,
 CASE WHEN s.refreshed_at IS NULL THEN 0 ELSE m.participant_count END AS participant_count,
 CASE WHEN s.refreshed_at IS NULL THEN 0 ELSE m.player_count END AS player_count,
 CASE WHEN s.refreshed_at IS NULL THEN NULL ELSE m.latest_collected_at END AS latest_collected_at,
 s.current_patch,s.retention_days,s.window_end AS as_of,s.refreshed_at,
 s.refreshed_at IS NOT NULL AS scope_ready
 FROM public.mv_tft_meta_summary m CROSS JOIN public.tft_meta_state s;
REVOKE ALL ON public.v_tft_meta_scope, public.v_tft_meta_current_summary FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.v_tft_meta_scope, public.v_tft_meta_current_summary TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_tft_meta_stats() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.tft_meta_state%ROWTYPE; started timestamptz:=clock_timestamp();
 evidence jsonb; candidate text; n integer; hits integer:=0; ratio numeric:=0;
 changed boolean:=false; expected bigint; actual bigint;
BEGIN
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 SELECT * INTO STRICT s FROM public.tft_meta_state WHERE singleton FOR UPDATE;
 -- patch is produced by the existing Collector patchFromVersion(game_version).
 -- Keep at most 100 unique recent observations even after non-current boards are deleted.
 WITH raw AS (
  SELECT match_id,patch,game_datetime FROM public.tft_matches
  WHERE ingestion_complete AND platform='kr' AND queue_id=1100
  AND game_datetime BETWEEN extract(epoch FROM(started-interval '7 days'))*1000 AND extract(epoch FROM started)*1000
  ORDER BY game_datetime DESC,match_id LIMIT s.confirm_sample_size
 ), combined AS (
  SELECT *,1 AS priority FROM raw UNION ALL
  SELECT x.*,2 FROM jsonb_to_recordset(s.observations) AS x(match_id text,patch text,game_datetime bigint)
 ), unique_matches AS (
  SELECT DISTINCT ON(match_id) match_id,patch,game_datetime FROM combined
  WHERE game_datetime BETWEEN extract(epoch FROM(started-interval '7 days'))*1000 AND extract(epoch FROM started)*1000
  ORDER BY match_id,priority
 ), recent AS (
  SELECT * FROM unique_matches ORDER BY game_datetime DESC,match_id LIMIT s.confirm_sample_size
 ) SELECT coalesce(jsonb_agg(to_jsonb(recent) ORDER BY game_datetime DESC,match_id),'[]') INTO evidence FROM recent;
 n:=jsonb_array_length(evidence);
 SELECT patch,count(*) INTO candidate,hits
 FROM jsonb_to_recordset(evidence) AS x(match_id text,patch text,game_datetime bigint)
 WHERE patch IS NOT NULL GROUP BY patch ORDER BY count(*) DESC,string_to_array(patch,'.')::int[] DESC LIMIT 1;
 hits:=coalesce(hits,0); ratio:=CASE WHEN n>0 THEN hits::numeric/n ELSE 0 END;
 IF n>=s.confirm_min_samples AND ratio>=s.confirm_ratio AND candidate IS NOT NULL
 AND (s.current_patch IS NULL OR string_to_array(candidate,'.')::int[]>string_to_array(s.current_patch,'.')::int[]) THEN
  s.current_patch:=candidate; s.confirmed_at:=started; changed:=true;
 END IF;
 UPDATE public.tft_meta_state SET current_patch=s.current_patch,confirmed_at=s.confirmed_at,
 detected_patch=candidate,detected_at=started,observations=evidence,window_end=started,updated_at=started
 WHERE singleton;
 REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tft_item_stats;
 REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tft_champion_stats;
 REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tft_trait_stats;
 REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tft_meta_summary;
 SELECT count(*) INTO expected FROM public.v_tft_meta_scope;
 SELECT match_count INTO actual FROM public.mv_tft_meta_summary;
 IF actual<>expected OR (SELECT participant_count FROM public.mv_tft_meta_summary)<>expected*8 THEN
  RAISE EXCEPTION 'Meta aggregate verification failed';
 END IF;
 UPDATE public.tft_meta_state SET refreshed_at=clock_timestamp(),generation=generation+1 WHERE singleton
 RETURNING generation INTO s.generation;
 RETURN jsonb_build_object('status','refreshed','current',s.current_patch,'candidate',candidate,
 'sampleSize',n,'candidateCount',hits,'ratio',ratio,'confirmed',changed,'window','7d',
 'generation',s.generation,'matchCount',actual,'elapsed_ms',round(extract(epoch FROM(clock_timestamp()-started))*1000));
END; $$;

CREATE FUNCTION public.cleanup_tft_meta_data(expected_generation bigint, batch_size integer DEFAULT 200) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.tft_meta_state%ROWTYPE; started timestamptz:=clock_timestamp();
 removed integer; old_patch integer; expired integer;
BEGIN
 IF batch_size NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'batch_size must be 1..500'; END IF;
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 SELECT * INTO STRICT s FROM public.tft_meta_state WHERE singleton FOR UPDATE;
 IF NOT s.cleanup_enabled THEN RETURN jsonb_build_object('status','disabled'); END IF;
 IF s.generation<>expected_generation OR s.refreshed_at IS NULL OR s.refreshed_at<started-interval '1 hour' THEN
  RAISE EXCEPTION 'Fresh verified aggregate generation required';
 END IF;
 -- Unknown current patch: age-only cleanup; do not guess a patch from external versions.
 -- Once confirmed: null/non-current boards are excluded and removed, bounded evidence survives.
 WITH targets AS MATERIALIZED (
  SELECT match_id,(s.current_patch IS NOT NULL AND patch IS DISTINCT FROM s.current_patch) AS old,
  (collected_at<s.window_end-interval '7 days' OR game_datetime<extract(epoch FROM(s.window_end-interval '7 days'))*1000) AS expired
  FROM public.tft_matches
  WHERE (s.current_patch IS NOT NULL AND patch IS DISTINCT FROM s.current_patch)
  OR collected_at<s.window_end-interval '7 days'
  OR game_datetime<extract(epoch FROM(s.window_end-interval '7 days'))*1000
  ORDER BY collected_at,match_id LIMIT batch_size FOR UPDATE
 ), deleted AS (
  DELETE FROM public.tft_matches m USING targets t WHERE m.match_id=t.match_id RETURNING t.old,t.expired
 ) SELECT count(*),count(*) FILTER(WHERE d.old),count(*) FILTER(WHERE d.expired AND NOT d.old)
 INTO removed,old_patch,expired FROM deleted d;
 RETURN jsonb_build_object('status','cleaned','currentPatch',s.current_patch,'deletedMatches',removed,
 'oldPatchMatches',old_patch,'expiredMatches',expired,'duration',round(extract(epoch FROM(clock_timestamp()-started))*1000));
END; $$;
CREATE FUNCTION public.tft_meta_db_size() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('bytes',pg_database_size(current_database()));
$$;
-- Avoid refetching recently discarded candidate boards; evidence is bounded to 100 IDs.
CREATE FUNCTION public.tft_meta_existing_matches(ids text[]) RETURNS TABLE(match_id text)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT m.match_id FROM public.tft_matches m WHERE m.match_id=ANY(ids)
 UNION SELECT x.match_id FROM public.tft_meta_state s,
 jsonb_to_recordset(s.observations) AS x(match_id text,patch text,game_datetime bigint)
 WHERE x.match_id=ANY(ids);
$$;
REVOKE ALL ON FUNCTION public.refresh_tft_meta_stats(),public.cleanup_tft_meta_data(bigint,integer),
 public.tft_meta_db_size(),public.tft_meta_existing_matches(text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_tft_meta_stats(),public.cleanup_tft_meta_data(bigint,integer),
 public.tft_meta_db_size(),public.tft_meta_existing_matches(text[]) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
