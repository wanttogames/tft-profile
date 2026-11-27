-- Apply after 013. The next scheduled refresh fills the set for its committed generation.
BEGIN;
ALTER TABLE public.tft_meta_state ADD COLUMN aggregate_set_number integer;

-- Runs in the existing refresh transaction, after all materialized views are updated.
CREATE FUNCTION public.capture_tft_meta_aggregate_set() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 SELECT CASE WHEN count(*)=count(set_number) AND min(set_number)=max(set_number)
             THEN min(set_number) END
 INTO NEW.aggregate_set_number
 FROM public.v_tft_meta_scope;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_tft_meta_aggregate_set() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tft_meta_capture_aggregate_set
 BEFORE UPDATE OF generation ON public.tft_meta_state
 FOR EACH ROW WHEN (OLD.generation IS DISTINCT FROM NEW.generation)
 EXECUTE FUNCTION public.capture_tft_meta_aggregate_set();

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
 h.scheduled_date,h.next_scheduled_date,h.next_cutoff_at,h.verification_url,s.generation,s.aggregate_set_number
 FROM public.mv_tft_meta_summary m CROSS JOIN public.tft_meta_state s
 LEFT JOIN public.tft_patch_calendar h ON h.patch=s.external_patch;

NOTIFY pgrst,'reload schema';
COMMIT;
