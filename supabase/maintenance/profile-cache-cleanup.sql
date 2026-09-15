-- Run daily in Supabase Cron (SQL job). Does not touch collector tables.
delete from public.tft_profile_match_cache where expires_at <= now();
-- Alternatively, after enabling pg_cron in Supabase, register ONCE:
-- select cron.schedule('tft-profile-cache-cleanup', '15 3 * * *',
--   $$delete from public.tft_profile_match_cache where expires_at <= now()$$);
