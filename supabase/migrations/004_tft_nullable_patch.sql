-- Apply after 001/002/003. Keep the original game_version even if patch is unknown.
-- The existing patch format CHECK accepts NULL and still validates non-null patches.
BEGIN;
ALTER TABLE public.tft_matches ALTER COLUMN patch DROP NOT NULL;
COMMENT ON COLUMN public.tft_matches.patch IS 'Best-effort client MAJOR.MINOR extracted from original game_version. NULL when unknown or ambiguous; must not block ingestion. Filter NULL explicitly in patch statistics.';
NOTIFY pgrst, 'reload schema';
COMMIT;
