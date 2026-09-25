-- Apply AFTER 009. No historical migration edits, raw backfill or immediate cleanup.
BEGIN;
ALTER TABLE public.tft_meta_state
 ADD COLUMN patch_source text CHECK(patch_source IN ('match','official')),
 ADD COLUMN external_patch text CHECK(external_patch ~ '^[0-9]+\.[0-9]+$'),
 ADD COLUMN external_source_url text,
 ADD COLUMN external_published_at timestamptz,
 ADD COLUMN external_checked_at timestamptz,
 ADD COLUMN external_boundary_at timestamptz,
 ADD COLUMN external_set_number integer CHECK(external_set_number>0);
UPDATE public.tft_meta_state SET patch_source='match' WHERE current_patch IS NOT NULL;

CREATE FUNCTION public.tft_meta_patch_probe() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 WITH recent AS (
  SELECT patch FROM public.tft_matches WHERE ingestion_complete AND platform='kr' AND queue_id=1100
  AND game_datetime BETWEEN extract(epoch FROM(now()-interval '7 days'))*1000 AND extract(epoch FROM now())*1000
  ORDER BY game_datetime DESC,match_id LIMIT 100
 ) SELECT jsonb_build_object('needsFallback',count(*)>0 AND count(patch)=0) FROM recent;
$$;
CREATE FUNCTION public.register_tft_external_patch(proposed_patch text,source_url text,published_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.tft_meta_state%ROWTYPE; checked timestamptz:=clock_timestamp();
BEGIN
 IF proposed_patch IS NULL OR proposed_patch !~ '^[0-9]{1,2}\.[0-9]{1,2}$'
 OR source_url IS NULL OR source_url<>'https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-'||replace(proposed_patch,'.','-')
 OR published_at IS NULL OR published_at>checked OR published_at<checked-interval '45 days' THEN
  RAISE EXCEPTION 'Invalid official TFT patch provenance';
 END IF;
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 SELECT * INTO STRICT s FROM public.tft_meta_state WHERE singleton FOR UPDATE;
 IF NOT (public.tft_meta_patch_probe()->>'needsFallback')::boolean THEN
  RETURN jsonb_build_object('status','primary-available');
 END IF;
 IF s.external_patch IS NOT NULL AND string_to_array(proposed_patch,'.')::int[]<string_to_array(s.external_patch,'.')::int[] THEN
  RETURN jsonb_build_object('status','older-source-ignored');
 END IF;
 UPDATE public.tft_meta_state SET external_patch=proposed_patch,detected_patch=proposed_patch,
 detected_at=checked,external_source_url=source_url,external_published_at=published_at,
 external_checked_at=checked,
 -- Confirmation boundary = first server-side verification of this official patch.
 -- NEVER substitute the article publication timestamp for actual deployment time.
 external_boundary_at=CASE WHEN external_patch=proposed_patch THEN external_boundary_at ELSE checked END,
 external_set_number=CASE WHEN external_patch=proposed_patch THEN external_set_number ELSE NULL END,
 updated_at=checked WHERE singleton;
 RETURN jsonb_build_object('status','registered','detectedPatch',proposed_patch,
 'boundary',(SELECT external_boundary_at FROM public.tft_meta_state));
END; $$;

CREATE OR REPLACE VIEW public.v_tft_meta_scope WITH (security_invoker=true) AS
 SELECT m.* FROM public.tft_matches m CROSS JOIN public.tft_meta_state s
 WHERE m.ingestion_complete AND m.platform='kr' AND m.queue_id=1100
 AND (m.patch=s.current_patch OR (
  m.patch IS NULL AND s.patch_source='official' AND s.external_patch=s.current_patch
  AND s.external_set_number=m.set_number
  AND s.external_checked_at>=s.window_end-interval '24 hours'
  AND m.game_datetime>=extract(epoch FROM s.external_boundary_at)*1000
 ))
 AND m.collected_at BETWEEN s.window_end-interval '7 days' AND s.window_end
 AND m.game_datetime BETWEEN extract(epoch FROM(s.window_end-interval '7 days'))*1000
                         AND extract(epoch FROM s.window_end)*1000;
CREATE OR REPLACE FUNCTION public.refresh_tft_meta_stats() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.tft_meta_state%ROWTYPE; started timestamptz:=clock_timestamp();
 evidence jsonb; candidate text; n integer; hits integer:=0; ratio numeric:=0;
 changed boolean:=false; expected bigint; actual bigint; ext_count integer; ext_sets integer; ext_set integer;
BEGIN
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 SELECT * INTO STRICT s FROM public.tft_meta_state WHERE singleton FOR UPDATE;
 -- patch is produced by the existing Collector patchFromVersion(game_version).
 -- Keep at most 100 unique recent observations even after non-current boards are deleted.
 WITH raw AS (
  SELECT match_id,patch,game_datetime,set_number FROM public.tft_matches
  WHERE ingestion_complete AND platform='kr' AND queue_id=1100
  AND game_datetime BETWEEN extract(epoch FROM(started-interval '7 days'))*1000 AND extract(epoch FROM started)*1000
  ORDER BY game_datetime DESC,match_id LIMIT s.confirm_sample_size
 ), combined AS (
  SELECT *,1 AS priority FROM raw UNION ALL
  SELECT x.*,2 FROM jsonb_to_recordset(s.observations) AS x(match_id text,patch text,game_datetime bigint,set_number integer)
 ), unique_matches AS (
  SELECT DISTINCT ON(match_id) match_id,patch,game_datetime,set_number FROM combined
  WHERE game_datetime BETWEEN extract(epoch FROM(started-interval '7 days'))*1000 AND extract(epoch FROM started)*1000
  ORDER BY match_id,priority
 ), recent AS (
  SELECT * FROM unique_matches ORDER BY game_datetime DESC,match_id LIMIT s.confirm_sample_size
 ) SELECT coalesce(jsonb_agg(to_jsonb(recent) ORDER BY game_datetime DESC,match_id),'[]') INTO evidence FROM recent;
 n:=jsonb_array_length(evidence);
 SELECT patch,count(*) INTO candidate,hits
 FROM jsonb_to_recordset(evidence) AS x(match_id text,patch text,game_datetime bigint,set_number integer)
 WHERE patch IS NOT NULL GROUP BY patch ORDER BY count(*) DESC,string_to_array(patch,'.')::int[] DESC LIMIT 1;
 hits:=coalesce(hits,0); ratio:=CASE WHEN n>0 THEN hits::numeric/n ELSE 0 END;
 IF n>=s.confirm_min_samples AND ratio>=s.confirm_ratio AND candidate IS NOT NULL
 AND (s.current_patch IS NULL OR s.patch_source='official' OR string_to_array(candidate,'.')::int[]>string_to_array(s.current_patch,'.')::int[]) THEN
  s.current_patch:=candidate; s.confirmed_at:=started; s.patch_source:='match'; s.external_set_number:=NULL; changed:=true;
 END IF;

 -- A parseable match patch always takes priority. External source is allowed
 -- ONLY if every latest observation has patch=NULL, never a mixed known/unknown cohort.
 IF candidate IS NULL AND n>=s.confirm_min_samples AND s.external_patch IS NOT NULL
 AND s.external_checked_at>=started-interval '24 hours' THEN
  SELECT count(*),count(DISTINCT set_number),min(set_number) INTO ext_count,ext_sets,ext_set
  FROM jsonb_to_recordset(evidence) AS x(match_id text,patch text,game_datetime bigint,set_number integer)
  WHERE game_datetime>=extract(epoch FROM s.external_boundary_at)*1000 AND set_number IS NOT NULL;
  IF ext_count>=s.confirm_min_samples AND ext_sets=1
  AND NOT EXISTS(SELECT 1 FROM jsonb_to_recordset(evidence) AS x(game_datetime bigint,set_number integer)
    WHERE game_datetime>=extract(epoch FROM s.external_boundary_at)*1000 AND set_number IS NULL)
  AND (s.current_patch IS NULL OR s.current_patch=s.external_patch
       OR string_to_array(s.external_patch,'.')::int[]>string_to_array(s.current_patch,'.')::int[]) THEN
   changed:=s.current_patch IS DISTINCT FROM s.external_patch OR s.patch_source IS DISTINCT FROM 'official';
   s.current_patch:=s.external_patch; s.patch_source:='official'; s.external_set_number:=ext_set;
   IF changed THEN s.confirmed_at:=started; s.external_boundary_at:=started; END IF;
  END IF;
 END IF;
 UPDATE public.tft_meta_state SET current_patch=s.current_patch,confirmed_at=s.confirmed_at,
 patch_source=s.patch_source,external_set_number=s.external_set_number,external_boundary_at=s.external_boundary_at,
 detected_patch=coalesce(candidate,s.external_patch),detected_at=started,observations=evidence,window_end=started,updated_at=started
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
 RETURN jsonb_build_object('status','refreshed','current',s.current_patch,'candidate',coalesce(candidate,s.external_patch),
 'sampleSize',n,'candidateCount',hits,'ratio',ratio,'confirmed',changed,'window','7d',
 'generation',s.generation,'matchCount',actual,'source',s.patch_source,
 'externalPatch',s.external_patch,'externalBoundary',s.external_boundary_at,
 'externalSampleSize',coalesce(ext_count,0),'externalRequiredSamples',s.confirm_min_samples,
 'itemMaxSample',(SELECT max(sample_count) FROM public.mv_tft_item_stats),
 'championMaxSample',(SELECT max(sample_count) FROM public.mv_tft_champion_stats),
 'traitMaxSample',(SELECT max(sample_count) FROM public.mv_tft_trait_stats),'elapsed_ms',round(extract(epoch FROM(clock_timestamp()-started))*1000));
END; $$;

CREATE OR REPLACE FUNCTION public.cleanup_tft_meta_data(expected_generation bigint, batch_size integer DEFAULT 200) RETURNS jsonb
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
 IF s.patch_source='official' AND NOT EXISTS(SELECT 1 FROM public.v_tft_meta_scope) THEN
  RETURN jsonb_build_object('status','awaiting-matches');
 END IF;
 -- Unknown current patch: age-only cleanup; do not guess a patch from external versions.
 -- Preserve inferred in-window NULL boards; only pre-boundary/wrong-set NULL boards are removed after external confirmation.
 WITH targets AS MATERIALIZED (
  SELECT match_id,(s.current_patch IS NOT NULL AND (
    (patch IS NOT NULL AND patch<>s.current_patch)
    OR (patch IS NULL AND s.external_patch IS NULL)
    OR (patch IS NULL AND s.patch_source='official' AND s.external_patch=s.current_patch
        AND s.external_set_number IS NOT NULL AND
        (game_datetime<extract(epoch FROM s.external_boundary_at)*1000 OR set_number IS DISTINCT FROM s.external_set_number))
   )) AS old,
  (collected_at<s.window_end-interval '7 days' OR game_datetime<extract(epoch FROM(s.window_end-interval '7 days'))*1000) AS expired
  FROM public.tft_matches
  WHERE (s.current_patch IS NOT NULL AND (
    (patch IS NOT NULL AND patch<>s.current_patch)
    OR (patch IS NULL AND s.external_patch IS NULL)
    OR (patch IS NULL AND s.patch_source='official' AND s.external_patch=s.current_patch
        AND s.external_set_number IS NOT NULL AND
        (game_datetime<extract(epoch FROM s.external_boundary_at)*1000 OR set_number IS DISTINCT FROM s.external_set_number))
   ))
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
CREATE OR REPLACE VIEW public.v_tft_meta_current_summary WITH (security_invoker=true) AS
 SELECT CASE WHEN s.refreshed_at IS NULL THEN 0 ELSE m.match_count END AS match_count,
 CASE WHEN s.refreshed_at IS NULL THEN 0 ELSE m.participant_count END AS participant_count,
 CASE WHEN s.refreshed_at IS NULL THEN 0 ELSE m.player_count END AS player_count,
 CASE WHEN s.refreshed_at IS NULL THEN NULL ELSE m.latest_collected_at END AS latest_collected_at,
 s.current_patch,s.retention_days,s.window_end AS as_of,s.refreshed_at,
 s.refreshed_at IS NOT NULL AS scope_ready,
 s.patch_source,s.external_boundary_at,s.external_source_url
 FROM public.mv_tft_meta_summary m CROSS JOIN public.tft_meta_state s;
REVOKE ALL ON FUNCTION public.tft_meta_patch_probe(),public.register_tft_external_patch(text,text,timestamptz)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tft_meta_patch_probe(),public.register_tft_external_patch(text,text,timestamptz)
 TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
