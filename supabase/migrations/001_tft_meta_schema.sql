-- TFT meta collection schema, PostgreSQL 15+ / Supabase SQL Editor.
-- Run this ENTIRE file once, as the SQL Editor postgres role.
-- Intentionally no IF NOT EXISTS: an incompatible existing schema must fail,
-- not silently appear migrated. BEGIN/COMMIT makes this migration atomic.
-- No API secrets, network requests, jobs, seed data or public API policies.
BEGIN;

CREATE TABLE public.tft_players (
    puuid text PRIMARY KEY CHECK (btrim(puuid) <> ''),
    platform text NOT NULL DEFAULT 'kr' CHECK (btrim(platform) <> ''),
    -- Collection metadata from League API, NOT inferred Match participant fields.
    is_tracked boolean NOT NULL DEFAULT false,
    current_tier text CHECK (current_tier IN (
        'IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD',
        'DIAMOND','MASTER','GRANDMASTER','CHALLENGER'
    )),
    league_points integer CHECK (league_points >= 0),
    rank_observed_at timestamptz,
    last_scanned_at timestamptz,
    collected_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tft_matches (
    match_id text PRIMARY KEY CHECK (btrim(match_id) <> ''),
    -- Preserve Riot's millisecond Unix epoch exactly; don't insert seconds here.
    game_datetime bigint NOT NULL CHECK (game_datetime >= 0),
    game_version text NOT NULL CHECK (btrim(game_version) <> ''),
    -- Collector-derived MAJOR.MINOR from game_version, e.g. '16.18'.
    -- TFT set number / marketing patch labels must never be substituted for this.
    patch text NOT NULL CHECK (patch ~ '^[0-9]+\.[0-9]+$'),
    queue_id integer NOT NULL CHECK (queue_id > 0),
    platform text NOT NULL DEFAULT 'kr' CHECK (btrim(platform) <> ''),
    -- Existing Match info.tft_set_number if provided; NULL if unavailable.
    set_number smallint CHECK (set_number > 0),
    collected_at timestamptz NOT NULL DEFAULT now(),
    -- Collector sets true only after the complete participant/board tree is saved.
    ingestion_complete boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    CONSTRAINT tft_matches_completion_check CHECK (
        (ingestion_complete AND completed_at IS NOT NULL)
        OR (NOT ingestion_complete AND completed_at IS NULL)
    )
);

CREATE TABLE public.tft_participants (
    participant_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    match_id text NOT NULL REFERENCES public.tft_matches(match_id) ON DELETE CASCADE,
    -- Player identity is shared across matches. Disable tracking instead of deleting it.
    puuid text NOT NULL REFERENCES public.tft_players(puuid) ON DELETE RESTRICT,
    placement smallint NOT NULL CHECK (placement BETWEEN 1 AND 8),
    level smallint NOT NULL CHECK (level > 0),
    last_round smallint NOT NULL CHECK (last_round >= 0),
    players_eliminated integer CHECK (players_eliminated >= 0),
    total_damage_to_players integer CHECK (total_damage_to_players >= 0),
    -- Immutable observation snapshot for cohort queries; NULL for unverified opponents.
    tier_at_collection text CHECK (tier_at_collection IN (
        'IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD',
        'DIAMOND','MASTER','GRANDMASTER','CHALLENGER'
    )),
    league_points_at_collection integer CHECK (league_points_at_collection >= 0),
    rank_observed_at timestamptz,
    collected_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tft_participants_match_player_key UNIQUE (match_id, puuid)
);

CREATE TABLE public.tft_units (
    unit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participant_id bigint NOT NULL REFERENCES public.tft_participants(participant_id) ON DELETE CASCADE,
    -- Zero-based index in participant.units, NOT character ID or board position.
    unit_index smallint NOT NULL CHECK (unit_index >= 0),
    character_id text NOT NULL CHECK (btrim(character_id) <> ''),
    tier smallint NOT NULL CHECK (tier > 0),
    -- Preserve Riot rarity code. This is not a shop-cost field.
    rarity smallint NOT NULL,
    collected_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tft_units_participant_index_key UNIQUE (participant_id, unit_index)
);

CREATE TABLE public.tft_unit_items (
    unit_id bigint NOT NULL REFERENCES public.tft_units(unit_id) ON DELETE CASCADE,
    -- Zero-based index of the string in unit.itemNames; not a physical board slot.
    item_index smallint NOT NULL CHECK (item_index >= 0),
    item_name text NOT NULL CHECK (btrim(item_name) <> ''),
    collected_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (unit_id, item_index)
);

CREATE TABLE public.tft_traits (
    participant_id bigint NOT NULL REFERENCES public.tft_participants(participant_id) ON DELETE CASCADE,
    name text NOT NULL CHECK (btrim(name) <> ''),
    num_units smallint NOT NULL CHECK (num_units >= 0),
    tier_current smallint NOT NULL CHECK (tier_current >= 0),
    tier_total smallint NOT NULL CHECK (tier_total >= 0),
    collected_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (participant_id, name)
);

-- PK/UNIQUE indexes already cover match_id, match_id+puuid, participant_id+unit_index,
-- unit_id+item_index and participant_id+name. Do not duplicate their FK-prefix indexes.
CREATE INDEX tft_players_tracked_ladder_idx
    ON public.tft_players (platform, current_tier, league_points DESC)
    WHERE is_tracked;
CREATE INDEX tft_matches_stats_idx
    ON public.tft_matches (platform, queue_id, patch, set_number, game_datetime DESC)
    WHERE ingestion_complete;
CREATE INDEX tft_matches_game_datetime_idx ON public.tft_matches (game_datetime DESC);
CREATE INDEX tft_matches_pending_idx ON public.tft_matches (collected_at)
    WHERE NOT ingestion_complete;
CREATE INDEX tft_participants_player_history_idx
    ON public.tft_participants (puuid, match_id);
CREATE INDEX tft_participants_cohort_idx
    ON public.tft_participants (tier_at_collection, match_id)
    INCLUDE (participant_id, placement)
    WHERE tier_at_collection IN ('CHALLENGER', 'GRANDMASTER');
CREATE INDEX tft_units_character_idx
    ON public.tft_units (character_id, participant_id) INCLUDE (tier, rarity);
CREATE INDEX tft_unit_items_item_idx
    ON public.tft_unit_items (item_name, unit_id);
CREATE INDEX tft_traits_active_name_idx
    ON public.tft_traits (name, participant_id) INCLUDE (num_units, tier_current)
    WHERE tier_current > 0;

COMMENT ON TABLE public.tft_players IS 'Shared Riot identity and latest collection-target metadata; not an application login table.';
COMMENT ON COLUMN public.tft_players.collected_at IS 'First insertion time; preserve on upsert. rank_observed_at and last_scanned_at track subsequent observations.';
COMMENT ON COLUMN public.tft_matches.game_datetime IS 'Original Riot UTC Unix epoch milliseconds. Convert with to_timestamp(game_datetime / 1000.0).';
COMMENT ON COLUMN public.tft_matches.patch IS 'Collector-normalized client MAJOR.MINOR from game_version, not tft_set_number. Unknown parsing must fail ingestion instead of guessing.';
COMMENT ON COLUMN public.tft_matches.ingestion_complete IS 'Only true rows may enter statistics. Set after saving the complete tree in one transaction; PK alone does not prove successful ingestion.';
COMMENT ON COLUMN public.tft_participants.tier_at_collection IS 'League observation at collection time, not historical tier at match start. NULL when not verified; never inherit tier from another participant.';
COMMENT ON COLUMN public.tft_participants.total_damage_to_players IS 'NULL means unavailable; zero is a measured zero.';
COMMENT ON COLUMN public.tft_units.unit_index IS 'API array index for retry identity; repeated character_id entries are valid.';
COMMENT ON COLUMN public.tft_units.rarity IS 'Raw Riot rarity enum/code; do not assume it equals shop cost.';
COMMENT ON COLUMN public.tft_unit_items.item_name IS 'Original itemNames string ID; Korean display names belong in the static-data lookup, not this fact table.';
COMMENT ON TABLE public.tft_traits IS 'Store active and inactive final traits; statistical use normally filters tier_current > 0.';

-- Raw participant data is server-only. RLS and explicit grants work together.
-- Conditional role handling also permits vanilla PostgreSQL installations without Supabase roles.
DO $permissions$
DECLARE
    table_name text;
    role_name text;
    sequence_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'tft_players','tft_matches','tft_participants','tft_units','tft_unit_items','tft_traits'
    ] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
        FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
                EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, role_name);
            END IF;
        END LOOP;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', table_name);
        END IF;
    END LOOP;
    FOREACH sequence_name IN ARRAY ARRAY['tft_participants_participant_id_seq','tft_units_unit_id_seq'] LOOP
        EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM PUBLIC', sequence_name);
        FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
                EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM %I', sequence_name, role_name);
            END IF;
        END LOOP;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
            EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO service_role', sequence_name);
        END IF;
    END LOOP;
END;
$permissions$;

COMMIT;
