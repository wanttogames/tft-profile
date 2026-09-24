-- Run once in Supabase SQL Editor as postgres AFTER 005 (007 may coexist).
-- Existing facts/views and historical migrations are preserved.
-- Initial population is deliberately done here, NOT on an API request.
BEGIN;
CREATE MATERIALIZED VIEW public.mv_tft_item_stats AS SELECT * FROM public.v_tft_item_stats;
CREATE MATERIALIZED VIEW public.mv_tft_champion_stats AS SELECT * FROM public.v_tft_champion_stats;
CREATE MATERIALIZED VIEW public.mv_tft_trait_stats AS SELECT * FROM public.v_tft_trait_stats;
CREATE MATERIALIZED VIEW public.mv_tft_meta_summary AS SELECT * FROM public.v_tft_meta_summary;
-- Nonpartial column-only unique indexes enable concurrent refresh (including empty stats).
CREATE UNIQUE INDEX mv_tft_item_stats_id ON public.mv_tft_item_stats(item_name);
CREATE UNIQUE INDEX mv_tft_champion_stats_id ON public.mv_tft_champion_stats(character_id);
CREATE UNIQUE INDEX mv_tft_trait_stats_id ON public.mv_tft_trait_stats(trait_name);
CREATE UNIQUE INDEX mv_tft_meta_summary_id ON public.mv_tft_meta_summary(match_count,participant_count,player_count);
-- Existing 001 PK/UNIQUE and indexes already cover raw JOIN/FK prefixes,
-- active traits and complete platform/queue filtering. Do not duplicate them.
-- Materialized result sets are small; no speculative raw covering indexes.

CREATE FUNCTION public.refresh_tft_meta_stats() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
DECLARE started timestamptz := clock_timestamp();
BEGIN
 -- One transaction across all views. Concurrent readers retain committed old results.
 -- Serialize refresh callers without queuing multiple full rebuilds.
 IF NOT pg_try_advisory_xact_lock(80421, 8) THEN
  RETURN jsonb_build_object('status','busy');
 END IF;
 REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tft_item_stats;
 REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tft_champion_stats;
 REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tft_trait_stats;
 REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_tft_meta_summary;
 RETURN jsonb_build_object('status','refreshed','elapsed_ms',
   round(extract(epoch FROM (clock_timestamp()-started))*1000));
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_tft_meta_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_tft_meta_stats() TO service_role;
REVOKE ALL ON public.mv_tft_item_stats,public.mv_tft_champion_stats,
 public.mv_tft_trait_stats,public.mv_tft_meta_summary FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.mv_tft_item_stats,public.mv_tft_champion_stats,
 public.mv_tft_trait_stats,public.mv_tft_meta_summary TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
