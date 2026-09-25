-- Upgrade for databases that already applied 010. No data rewrite or automatic refresh.
BEGIN;
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
   -- Keep the first official registration boundary: the confirming cohort must remain in scope.
   IF changed THEN s.confirmed_at:=started; END IF;
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

NOTIFY pgrst,'reload schema';
COMMIT;
