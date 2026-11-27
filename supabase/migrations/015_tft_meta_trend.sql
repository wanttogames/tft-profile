-- After 014. Neither this migration nor the bootstrap deletes raw games.
BEGIN;
CREATE TABLE public.tft_meta_snapshot (
 snapshot_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 set_number integer NOT NULL,
 patch text NOT NULL,
 snapshot_date date NOT NULL,
 snapshot_type text NOT NULL DEFAULT 'daily' CHECK (snapshot_type IN ('daily','final')),
 snapshot_at timestamptz NOT NULL,
 aggregation_generation bigint NOT NULL UNIQUE,
 window_start timestamptz NOT NULL,
 window_end timestamptz NOT NULL,
 match_count integer NOT NULL CHECK (match_count>0),
 participant_count integer NOT NULL CHECK (participant_count=match_count*8),
 patch_source text NOT NULL CHECK (patch_source IN ('match','official')),
 boundary_basis text,
 confidence_status text NOT NULL CHECK (confidence_status IN ('confirmed','verified','schedule-estimate','first-observed')),
 metadata_generation bigint,
 scoring_version text NOT NULL DEFAULT '1.0',
 definition_version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(set_number,patch,snapshot_date)
);

CREATE TABLE public.tft_meta_snapshot_entity (
 snapshot_id bigint NOT NULL REFERENCES public.tft_meta_snapshot ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('champion','item','trait')),
 entity_id text NOT NULL,
 sample_count integer NOT NULL CHECK (sample_count>0),
 avg_placement real NOT NULL,
 top4_rate real NOT NULL,
 win_rate real NOT NULL,
 details jsonb,
 catalog jsonb,
 PRIMARY KEY(snapshot_id,kind,entity_id)
);

ALTER TABLE public.tft_meta_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tft_meta_snapshot_entity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tft_meta_snapshot,public.tft_meta_snapshot_entity FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tft_meta_snapshot,public.tft_meta_snapshot_entity TO service_role;

-- Called only under the existing refresh lock. The daily row preserves the newest
-- healthy aggregate. Original classification is immutable once a generation is saved.
CREATE FUNCTION public.capture_tft_meta_snapshot() RETURNS bigint
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s record; basis text; id bigint; day date;
BEGIN
 SELECT * INTO STRICT s FROM public.v_tft_meta_current_summary;
 IF NOT s.scope_ready OR s.preview_patch IS NOT NULL OR s.preview_set_number IS NOT NULL
    OR s.current_patch IS NULL OR s.aggregate_set_number IS NULL OR s.generation<=0
    OR s.match_count=0 OR s.participant_count<>s.match_count*8
    OR s.patch_source NOT IN ('match','official') OR s.patch_source IS NULL THEN
  RETURN NULL;
 END IF;
 IF s.patch_source='official' AND s.external_patch IS DISTINCT FROM s.current_patch THEN RETURN NULL; END IF;
 SELECT snapshot_id INTO id FROM public.tft_meta_snapshot WHERE aggregation_generation=s.generation;
 IF FOUND THEN RETURN id; END IF;

 basis:=CASE WHEN s.patch_source='official' THEN coalesce(s.boundary_basis,'first-observed') END;
 day:=(s.as_of AT TIME ZONE 'Asia/Seoul')::date;

 -- Promote the most recent saved observation per previous patch in place.
 -- No duplicate rows are written for final aggregates.
 UPDATE public.tft_meta_snapshot snap SET snapshot_type='final',updated_at=now()
 WHERE snap.snapshot_id IN (
   SELECT DISTINCT ON (p.set_number,p.patch) p.snapshot_id
   FROM public.tft_meta_snapshot p
   WHERE (p.set_number,p.patch)<>(s.aggregate_set_number,s.current_patch)
     AND NOT EXISTS (SELECT 1 FROM public.tft_meta_snapshot f WHERE f.set_number=p.set_number AND f.patch=p.patch AND f.snapshot_type='final')
   ORDER BY p.set_number,p.patch,p.aggregation_generation DESC
 );

 INSERT INTO public.tft_meta_snapshot(
  set_number,patch,snapshot_date,snapshot_at,aggregation_generation,window_start,window_end,
  match_count,participant_count,patch_source,boundary_basis,confidence_status)
 VALUES(s.aggregate_set_number,s.current_patch,day,s.refreshed_at,s.generation,s.as_of-interval '7 days',s.as_of,
   s.match_count,s.participant_count,s.patch_source,basis,coalesce(basis,'confirmed'))
 ON CONFLICT(set_number,patch,snapshot_date) DO UPDATE SET
  snapshot_at=excluded.snapshot_at,aggregation_generation=excluded.aggregation_generation,
  window_start=excluded.window_start,window_end=excluded.window_end,match_count=excluded.match_count,
  participant_count=excluded.participant_count,patch_source=excluded.patch_source,boundary_basis=excluded.boundary_basis,
  confidence_status=excluded.confidence_status,scoring_version=excluded.scoring_version,
  definition_version=excluded.definition_version,updated_at=now()
 WHERE public.tft_meta_snapshot.snapshot_type='daily'
   AND public.tft_meta_snapshot.aggregation_generation<excluded.aggregation_generation
 RETURNING snapshot_id INTO id;
 IF id IS NULL THEN RETURN NULL; END IF;

 -- Keep unchanged entity rows to avoid hourly delete/reinsert churn.
 DELETE FROM public.tft_meta_snapshot_entity e WHERE e.snapshot_id=id AND (
  (e.kind='champion' AND NOT EXISTS (SELECT 1 FROM public.mv_tft_champion_stats x WHERE x.character_id=e.entity_id)) OR
  (e.kind='item' AND NOT EXISTS (SELECT 1 FROM public.mv_tft_item_stats x WHERE x.item_name=e.entity_id)) OR
  (e.kind='trait' AND NOT EXISTS (SELECT 1 FROM public.mv_tft_trait_stats x WHERE x.trait_name=e.entity_id))
 );
 INSERT INTO public.tft_meta_snapshot_entity(snapshot_id,kind,entity_id,sample_count,avg_placement,top4_rate,win_rate,details)
 SELECT id,'champion',character_id,sample_count,avg_placement,top4_rate,win_rate,
   jsonb_build_object('avg_star_level',avg_star_level,'common_items',common_items) FROM public.mv_tft_champion_stats
 UNION ALL
 SELECT id,'item',item_name,sample_count,avg_placement,top4_rate,win_rate,
   jsonb_build_object('common_champions',common_champions) FROM public.mv_tft_item_stats
 UNION ALL
 SELECT id,'trait',trait_name,sample_count,avg_placement,top4_rate,win_rate,
   jsonb_build_object('tier_samples',tier_samples) FROM public.mv_tft_trait_stats
 ON CONFLICT(snapshot_id,kind,entity_id) DO UPDATE SET
 sample_count=excluded.sample_count,avg_placement=excluded.avg_placement,
 top4_rate=excluded.top4_rate,win_rate=excluded.win_rate,details=excluded.details
 WHERE (tft_meta_snapshot_entity.sample_count,tft_meta_snapshot_entity.avg_placement,
   tft_meta_snapshot_entity.top4_rate,tft_meta_snapshot_entity.win_rate,tft_meta_snapshot_entity.details)
 IS DISTINCT FROM (excluded.sample_count,excluded.avg_placement,excluded.top4_rate,excluded.win_rate,excluded.details);
 RETURN id;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_tft_meta_snapshot() FROM PUBLIC,anon,authenticated,service_role;

-- Preserve 013's implementation and keep the RPC signature unchanged.
ALTER FUNCTION public.refresh_tft_meta_stats() RENAME TO refresh_tft_meta_stats_without_history;
REVOKE ALL ON FUNCTION public.refresh_tft_meta_stats_without_history() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.refresh_tft_meta_stats() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE result jsonb; captured bigint;
BEGIN
 IF NOT pg_try_advisory_xact_lock(80421,8) THEN RETURN jsonb_build_object('status','busy'); END IF;
 PERFORM public.capture_tft_meta_snapshot();
 result:=public.refresh_tft_meta_stats_without_history();
 captured:=public.capture_tft_meta_snapshot();
 DELETE FROM public.tft_meta_snapshot
 WHERE snapshot_type='daily' AND snapshot_date <= (statement_timestamp() AT TIME ZONE 'Asia/Seoul')::date - 90;
 RETURN result||jsonb_build_object('snapshotId',captured);
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_tft_meta_stats() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_tft_meta_stats() TO service_role;
-- Bind catalog/title/score metadata to a particular saved generation. Numeric
-- aggregates are already durable, so catalog availability cannot block cleanup.
CREATE FUNCTION public.seal_tft_meta_snapshot_metadata(
 target_id bigint, expected_generation bigint, expected_scoring_version text, entries jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF jsonb_typeof(entries) IS DISTINCT FROM 'array' OR jsonb_array_length(entries)>10000 THEN
  RAISE EXCEPTION 'Invalid snapshot metadata';
 END IF;
 PERFORM 1 FROM public.tft_meta_snapshot
 WHERE snapshot_id=target_id AND aggregation_generation=expected_generation
 AND scoring_version=expected_scoring_version AND snapshot_type='daily'
 AND metadata_generation IS DISTINCT FROM expected_generation
 FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.tft_meta_snapshot_entity e SET catalog=x.catalog
 FROM jsonb_to_recordset(entries) AS x(kind text,entity_id text,catalog jsonb)
 WHERE e.snapshot_id=target_id AND e.kind=x.kind AND e.entity_id=x.entity_id
 AND e.catalog IS DISTINCT FROM x.catalog;
 UPDATE public.tft_meta_snapshot SET metadata_generation=expected_generation,updated_at=now()
 WHERE snapshot_id=target_id;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.seal_tft_meta_snapshot_metadata(bigint,bigint,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.seal_tft_meta_snapshot_metadata(bigint,bigint,text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
