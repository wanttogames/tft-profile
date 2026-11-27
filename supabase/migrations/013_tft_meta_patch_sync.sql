-- TFT-META-PATCH-SYNC-1. Apply after 012. No match rewrite or delete.
BEGIN;
CREATE TABLE public.tft_patch_calendar (
 patch text PRIMARY KEY CHECK(patch ~ '^[0-9]{1,2}\.[0-9]{1,2}$'),
 expected_set integer NOT NULL CHECK(expected_set>0),
 source_url text NOT NULL,
 published_at timestamptz NOT NULL,
 first_seen_at timestamptz NOT NULL,
 checked_at timestamptz NOT NULL,
 scheduled_date date,
 next_scheduled_date date,
 schedule_checked_at timestamptz,
 estimated_from timestamptz,
 next_cutoff_at timestamptz,
 verified_live_by timestamptz,
 verification_url text,
 CHECK((verified_live_by IS NULL)=(verification_url IS NULL)),
 CHECK(next_scheduled_date IS NULL OR next_scheduled_date>scheduled_date)
);
ALTER TABLE public.tft_patch_calendar ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tft_patch_calendar FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.tft_patch_calendar TO service_role;
ALTER TABLE public.tft_meta_state ADD COLUMN preview_patch text;
-- Preserve provenance of an existing candidate; do not invent a historical start.
INSERT INTO public.tft_patch_calendar(patch,expected_set,source_url,published_at,first_seen_at,checked_at,verified_live_by,verification_url)
SELECT external_patch,split_part(external_patch,'.',1)::int,external_source_url,external_published_at,
 coalesce(external_boundary_at,external_checked_at),external_checked_at,
 CASE WHEN external_boundary_evidence IS NOT NULL THEN external_boundary_at END,external_boundary_evidence
FROM public.tft_meta_state WHERE external_patch IS NOT NULL AND external_source_url IS NOT NULL
 AND external_published_at IS NOT NULL AND external_checked_at IS NOT NULL
 AND external_patch ~ '^[0-9]{1,2}\.[0-9]{1,2}$' AND split_part(external_patch,'.',1)::int>0;

-- The calendar cross-check is an estimate, NOT KR deployment confirmation.
-- 48h after both publication and scheduled Pacific midnight is a deliberate guard.
CREATE FUNCTION public.sync_tft_patch_calendar(proposed_patch text,source_url text,published_at timestamptz,
 scheduled_date date DEFAULT NULL,next_scheduled_date date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.tft_meta_state%ROWTYPE; h public.tft_patch_calendar%ROWTYPE;
 checked timestamptz:=clock_timestamp(); estimate timestamptz; cutoff timestamptz; expected integer;
BEGIN
 IF proposed_patch IS NULL OR proposed_patch !~ '^[1-9][0-9]?\.[0-9]{1,2}$'
 OR source_url IS NULL OR source_url<>'https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-'||replace(proposed_patch,'.','-')
 OR published_at IS NULL OR published_at>checked OR published_at<checked-interval '45 days' THEN
  RAISE EXCEPTION 'Invalid official TFT patch provenance';
 END IF;
 expected:=split_part(proposed_patch,'.',1)::int;
 IF scheduled_date IS NOT NULL THEN
  IF abs(scheduled_date-(published_at AT TIME ZONE 'America/Los_Angeles')::date)>3
   OR (next_scheduled_date IS NOT NULL AND (next_scheduled_date<=scheduled_date OR next_scheduled_date>scheduled_date+60)) THEN
   RAISE EXCEPTION 'Patch calendar does not agree with article date';
  END IF;
  estimate:=greatest(published_at,(scheduled_date::timestamp AT TIME ZONE 'America/Los_Angeles'))+interval '48 hours';
  cutoff:=next_scheduled_date::timestamp AT TIME ZONE 'America/Los_Angeles';
 ELSIF next_scheduled_date IS NOT NULL THEN RAISE EXCEPTION 'Missing scheduled date'; END IF;
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 SELECT * INTO STRICT s FROM public.tft_meta_state WHERE singleton FOR UPDATE;
 IF s.external_patch IS NOT NULL AND string_to_array(proposed_patch,'.')::int[]<string_to_array(s.external_patch,'.')::int[] THEN
  RETURN jsonb_build_object('status','older-source-ignored');
 END IF;
 INSERT INTO public.tft_patch_calendar AS c(patch,expected_set,source_url,published_at,first_seen_at,checked_at,
 scheduled_date,next_scheduled_date,schedule_checked_at,estimated_from,next_cutoff_at)
 VALUES($1,expected,$2,$3,checked,checked,$4,$5,
 CASE WHEN $4 IS NOT NULL THEN checked END,estimate,cutoff)
 ON CONFLICT(patch) DO UPDATE SET checked_at=excluded.checked_at,
 scheduled_date=coalesce(excluded.scheduled_date,c.scheduled_date),
 next_scheduled_date=CASE WHEN excluded.scheduled_date IS NOT NULL THEN excluded.next_scheduled_date ELSE c.next_scheduled_date END,
 schedule_checked_at=coalesce(excluded.schedule_checked_at,c.schedule_checked_at),
 estimated_from=CASE WHEN excluded.scheduled_date IS NOT NULL THEN greatest(c.published_at,excluded.estimated_from-interval '48 hours')+interval '48 hours' ELSE c.estimated_from END,
 next_cutoff_at=CASE WHEN excluded.scheduled_date IS NOT NULL THEN excluded.next_cutoff_at ELSE c.next_cutoff_at END;
 SELECT * INTO STRICT h FROM public.tft_patch_calendar WHERE patch=proposed_patch;
 -- Close older intervals conservatively when a newer official article is observed.
 UPDATE public.tft_patch_calendar c SET next_cutoff_at=least(c.next_cutoff_at,h.published_at)
 WHERE string_to_array(c.patch,'.')::int[]<string_to_array(proposed_patch,'.')::int[]
 AND c.published_at<h.published_at;
 UPDATE public.tft_meta_state SET external_patch=proposed_patch,detected_patch=proposed_patch,detected_at=checked,
 external_source_url=h.source_url,external_published_at=h.published_at,external_checked_at=checked,
 external_boundary_at=coalesce(h.verified_live_by,h.estimated_from,h.first_seen_at),
 external_boundary_evidence=h.verification_url,
 external_set_number=CASE WHEN external_patch=proposed_patch THEN external_set_number ELSE NULL END,
 updated_at=checked WHERE singleton;
 RETURN jsonb_build_object('status','registered','detectedPatch',proposed_patch,'boundary',coalesce(h.verified_live_by,h.estimated_from,h.first_seen_at),
 'basis',CASE WHEN h.verified_live_by IS NOT NULL THEN 'verified' WHEN h.estimated_from IS NOT NULL THEN 'schedule-estimate' ELSE 'first-observed' END,
 'expectedSet',expected,'nextCutoff',h.next_cutoff_at);
END; $$;
REVOKE ALL ON FUNCTION public.sync_tft_patch_calendar(text,text,timestamptz,date,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_tft_patch_calendar(text,text,timestamptz,date,date) TO service_role;

-- Existing collector fallback keeps its probe and never overwrites calendar data.
CREATE OR REPLACE FUNCTION public.register_tft_external_patch(proposed_patch text,source_url text,published_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF NOT (public.tft_meta_patch_probe()->>'needsFallback')::boolean THEN
  RETURN jsonb_build_object('status','primary-available');
 END IF;
 RETURN public.sync_tft_patch_calendar(proposed_patch,source_url,published_at,NULL,NULL);
END; $$;

-- Owner attestation: a verified time by which KR was live, not necessarily exact rollout.
CREATE OR REPLACE FUNCTION public.set_tft_verified_kr_boundary(patch text, rollout_at timestamptz, evidence_url text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.tft_meta_state%ROWTYPE; h public.tft_patch_calendar%ROWTYPE;
BEGIN
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 SELECT * INTO STRICT s FROM public.tft_meta_state WHERE singleton FOR UPDATE;
 SELECT * INTO h FROM public.tft_patch_calendar c WHERE c.patch=$1;
 IF NOT FOUND OR s.external_patch IS DISTINCT FROM patch OR rollout_at IS NULL
 OR rollout_at<h.published_at OR rollout_at>clock_timestamp()
 OR (h.next_cutoff_at IS NOT NULL AND rollout_at>=h.next_cutoff_at)
 OR evidence_url IS NULL OR evidence_url !~ '^https://[^[:space:]]+$' OR length(evidence_url)>2048 THEN
  RAISE EXCEPTION 'Verified KR boundary, matching patch and HTTPS evidence required';
 END IF;
 UPDATE public.tft_patch_calendar c SET verified_live_by=rollout_at,verification_url=evidence_url WHERE c.patch=$1;
 UPDATE public.tft_meta_state SET external_boundary_at=rollout_at,external_boundary_evidence=evidence_url,updated_at=clock_timestamp() WHERE singleton;
 RETURN jsonb_build_object('status','registered','patch',patch,'boundary',rollout_at);
END; $$;
REVOKE ALL ON FUNCTION public.set_tft_verified_kr_boundary(text,timestamptz,text) FROM PUBLIC,anon,authenticated,service_role;

-- A single helper enforces set and time interval in preview, confirmation and aggregate scope.
CREATE FUNCTION public.tft_patch_window_matches(patch_id text, match_set integer, game_ms bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
 SELECT coalesce((SELECT match_set=c.expected_set
 AND game_ms>=extract(epoch FROM coalesce(c.verified_live_by,c.estimated_from,c.first_seen_at))*1000
 AND (c.next_cutoff_at IS NULL OR game_ms<extract(epoch FROM c.next_cutoff_at)*1000)
 FROM public.tft_patch_calendar c WHERE c.patch=patch_id),false);
$$;
REVOKE ALL ON FUNCTION public.tft_patch_window_matches(text,integer,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tft_patch_window_matches(text,integer,bigint) TO service_role;

CREATE OR REPLACE VIEW public.v_tft_meta_scope WITH (security_invoker=true) AS
 SELECT m.* FROM public.tft_matches m CROSS JOIN public.tft_meta_state s
 WHERE m.ingestion_complete AND m.platform='kr' AND m.queue_id=1100
 AND ((s.preview_set_number IS NOT NULL AND m.patch IS NULL AND m.set_number=s.preview_set_number
 AND (s.preview_patch IS NULL OR public.tft_patch_window_matches(s.preview_patch,m.set_number,m.game_datetime))) OR
 (s.preview_set_number IS NULL AND (m.patch=s.current_patch OR (
  m.patch IS NULL AND s.patch_source='official' AND s.external_patch=s.current_patch
  AND s.external_set_number=m.set_number
  AND s.external_checked_at>=s.window_end-interval '24 hours'
  AND public.tft_patch_window_matches(s.current_patch,m.set_number,m.game_datetime)
 ))))
 AND m.collected_at BETWEEN s.window_end-interval '7 days' AND s.window_end
 AND m.game_datetime BETWEEN extract(epoch FROM(s.window_end-interval '7 days'))*1000
                         AND extract(epoch FROM s.window_end)*1000;


CREATE OR REPLACE FUNCTION public.refresh_tft_meta_stats() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.tft_meta_state%ROWTYPE; started timestamptz:=clock_timestamp();
 evidence jsonb; candidate text; n integer; hits integer:=0; ratio numeric:=0;
 changed boolean:=false; expected bigint; actual bigint; ext_count integer:=0; ext_sets integer; ext_set integer;
 stored_count integer; unresolved_count integer; unknown_sets integer; unknown_set integer; unknown_missing integer; latest_stored timestamptz;
 h public.tft_patch_calendar%ROWTYPE; window_count integer:=0; window_conflicts integer:=0;
BEGIN
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 SELECT * INTO STRICT s FROM public.tft_meta_state WHERE singleton FOR UPDATE;
 SELECT * INTO h FROM public.tft_patch_calendar WHERE patch=s.external_patch;
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
 IF candidate IS NULL AND s.external_patch IS NOT NULL
 AND s.external_checked_at>=started-interval '24 hours'
 AND (h.verified_live_by IS NOT NULL OR (h.estimated_from IS NOT NULL AND h.schedule_checked_at>=started-interval '24 hours')) THEN
  -- Count only actual complete boards inside the calendar interval and expected set.
  SELECT count(*) FILTER(WHERE x.patch IS NULL AND public.tft_patch_window_matches(s.external_patch,x.set_number,x.game_datetime)),
    count(*) FILTER(WHERE x.patch IS NOT NULL OR x.set_number IS NULL OR x.set_number<>h.expected_set)
  INTO ext_count,window_conflicts FROM public.tft_matches x
  WHERE x.ingestion_complete AND x.platform='kr' AND x.queue_id=1100
  AND x.collected_at BETWEEN started-interval '7 days' AND started
  AND x.game_datetime BETWEEN greatest(extract(epoch FROM s.external_boundary_at),extract(epoch FROM(started-interval '7 days')))*1000 AND extract(epoch FROM started)*1000
  AND (h.next_cutoff_at IS NULL OR x.game_datetime<extract(epoch FROM h.next_cutoff_at)*1000);
  ext_set:=h.expected_set;
  IF ext_count>=s.confirm_min_samples AND window_conflicts=0
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
 ,preview_set_number=NULL,preview_patch=NULL WHERE singleton;
 SELECT count(*),count(*) FILTER(WHERE patch IS NULL),
 count(DISTINCT set_number) FILTER(WHERE patch IS NULL),
 min(set_number) FILTER(WHERE patch IS NULL),
 count(*) FILTER(WHERE patch IS NULL AND set_number IS NULL),max(collected_at)
 INTO stored_count,unresolved_count,unknown_sets,unknown_set,unknown_missing,latest_stored
 FROM public.tft_matches
 WHERE ingestion_complete AND platform='kr' AND queue_id=1100
 AND collected_at BETWEEN started-interval '7 days' AND started
 AND game_datetime BETWEEN extract(epoch FROM(started-interval '7 days'))*1000 AND extract(epoch FROM started)*1000;
 -- A single-set unknown-patch preview is descriptive only, never confirmation evidence.
 IF candidate IS NULL AND s.external_patch IS NOT NULL
 AND s.external_checked_at>=started-interval '24 hours'
 AND NOT EXISTS(SELECT 1 FROM public.v_tft_meta_scope) THEN
  -- An eligible calendar preview takes priority over generic mixed-patch reference data.
  IF ext_count>0 AND window_conflicts=0 THEN
   UPDATE public.tft_meta_state SET preview_set_number=h.expected_set,preview_patch=s.external_patch WHERE singleton;
  ELSIF unknown_sets=1 AND unknown_missing=0 AND unresolved_count>0 THEN
   UPDATE public.tft_meta_state SET preview_set_number=unknown_set WHERE singleton;
  END IF;
 END IF;
 UPDATE public.tft_meta_state SET stored_match_count=stored_count,unresolved_match_count=unresolved_count,
 external_eligible_count=ext_count,latest_stored_at=latest_stored WHERE singleton;
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
 RETURNING generation,preview_set_number,preview_patch INTO s.generation,s.preview_set_number,s.preview_patch;
 RETURN jsonb_build_object('status','refreshed','current',s.current_patch,'candidate',coalesce(candidate,s.external_patch),
 'sampleSize',n,'candidateCount',hits,'ratio',ratio,'confirmed',changed,'window','7d',
 'generation',s.generation,'matchCount',actual,'source',s.patch_source,
 'storedMatchCount',stored_count,'unresolvedMatchCount',unresolved_count,'previewSetNumber',s.preview_set_number,
 'confirmedMatchCount',CASE WHEN s.preview_set_number IS NULL THEN actual ELSE 0 END,
 'externalPatch',s.external_patch,'externalBoundary',s.external_boundary_at,
 'previewPatch',s.preview_patch,'expectedSet',h.expected_set,'calendarConflicts',window_conflicts,
 'boundaryBasis',CASE WHEN h.verified_live_by IS NOT NULL THEN 'verified' WHEN h.estimated_from IS NOT NULL THEN 'schedule-estimate' WHEN h.patch IS NOT NULL THEN 'first-observed' END,
 'externalSampleSize',coalesce(ext_count,0),'externalRequiredSamples',s.confirm_min_samples,
 'itemMaxSample',(SELECT max(sample_count) FROM public.mv_tft_item_stats),
 'championMaxSample',(SELECT max(sample_count) FROM public.mv_tft_champion_stats),
 'traitMaxSample',(SELECT max(sample_count) FROM public.mv_tft_trait_stats),'elapsed_ms',round(extract(epoch FROM(clock_timestamp()-started))*1000));
END; $$;



CREATE OR REPLACE FUNCTION public.cleanup_tft_meta_data(expected_generation bigint, batch_size integer DEFAULT 200) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.tft_meta_state%ROWTYPE; started timestamptz:=clock_timestamp();
 removed integer; old_patch integer; expired integer; preserve_pending boolean;
BEGIN
 IF batch_size NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'batch_size must be 1..500'; END IF;
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 SELECT * INTO STRICT s FROM public.tft_meta_state WHERE singleton FOR UPDATE;
 IF NOT s.cleanup_enabled THEN RETURN jsonb_build_object('status','disabled'); END IF;
 IF s.generation<>expected_generation OR s.refreshed_at IS NULL OR s.refreshed_at<started-interval '1 hour' THEN
  RAISE EXCEPTION 'Fresh verified aggregate generation required';
 END IF;
 -- Age-only cleanup remains safe even if a patch is not yet confirmed.
 preserve_pending := s.current_patch IS NULL OR NOT EXISTS(SELECT 1 FROM public.v_tft_meta_scope) OR s.preview_set_number IS NOT NULL OR (s.external_patch IS NOT NULL AND s.external_patch IS DISTINCT FROM s.current_patch);
 -- Unknown current patch: age-only cleanup; do not guess a patch from external versions.
 -- Preserve all recent unknown-patch boards for calendar correction; expire them only by age.
 WITH targets AS MATERIALIZED (
  SELECT match_id,(NOT preserve_pending AND s.current_patch IS NOT NULL AND (
    (patch IS NOT NULL AND patch<>s.current_patch)
   )) AS old,
  (collected_at<s.window_end-interval '7 days' OR game_datetime<extract(epoch FROM(s.window_end-interval '7 days'))*1000) AS expired
  FROM public.tft_matches
  WHERE (NOT preserve_pending AND s.current_patch IS NOT NULL AND (
    (patch IS NOT NULL AND patch<>s.current_patch)
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
 s.patch_source,s.external_boundary_at,s.external_source_url,
 s.stored_match_count,s.unresolved_match_count,s.external_eligible_count,s.confirm_min_samples,
 s.detected_patch,s.external_patch,s.preview_set_number,s.latest_stored_at,
 CASE WHEN s.preview_set_number IS NULL AND s.refreshed_at IS NOT NULL THEN m.match_count ELSE 0 END AS confirmed_match_count,
 s.preview_patch,
 CASE WHEN h.verified_live_by IS NOT NULL THEN 'verified' WHEN h.estimated_from IS NOT NULL THEN 'schedule-estimate' WHEN h.patch IS NOT NULL THEN 'first-observed' END AS boundary_basis,
 h.scheduled_date,h.next_scheduled_date,h.next_cutoff_at,h.verification_url
 FROM public.mv_tft_meta_summary m CROSS JOIN public.tft_meta_state s
 LEFT JOIN public.tft_patch_calendar h ON h.patch=s.external_patch;


NOTIFY pgrst,'reload schema';
COMMIT;
