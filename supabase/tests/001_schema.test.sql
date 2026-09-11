-- Optional regression test. Run after migration on a development database as postgres.
-- Test data is always rolled back on success. No pgTAP extension is required.
BEGIN;
DO $test$
DECLARE
    p_id bigint;
    u_id bigint;
    other_unit_id bigint;
    t text;
BEGIN
    INSERT INTO public.tft_players (puuid) VALUES ('__schema_test_player__');
    INSERT INTO public.tft_matches (match_id, game_datetime, game_version, patch, queue_id)
        VALUES ('__schema_test_match__', 1789020000000, 'Version 16.18.1', '16.18', 1100);
    INSERT INTO public.tft_participants (match_id, puuid, placement, level, last_round)
        VALUES ('__schema_test_match__', '__schema_test_player__', 1, 9, 35)
        RETURNING participant_id INTO p_id;
    INSERT INTO public.tft_units (participant_id, unit_index, character_id, tier, rarity)
        VALUES (p_id, 0, 'fixture_unit', 2, 4) RETURNING unit_id INTO u_id;
    -- Same character twice must remain representable.
    INSERT INTO public.tft_units (participant_id, unit_index, character_id, tier, rarity)
        VALUES (p_id, 1, 'fixture_unit', 1, 4) RETURNING unit_id INTO other_unit_id;
    -- Same item twice must remain representable.
    INSERT INTO public.tft_unit_items (unit_id, item_index, item_name)
        VALUES (u_id, 0, 'fixture_item'), (u_id, 1, 'fixture_item');
    INSERT INTO public.tft_traits (participant_id, name, num_units, tier_current, tier_total)
        VALUES (p_id, 'fixture_active', 4, 2, 4), (p_id, 'fixture_inactive', 1, 0, 3);
    IF (SELECT count(*) FROM public.tft_unit_items WHERE unit_id=u_id) <> 2 THEN
        RAISE EXCEPTION 'duplicate item copies lost';
    END IF;
    IF (SELECT count(DISTINCT u.participant_id) FROM public.tft_units u
        JOIN public.tft_unit_items i USING(unit_id) WHERE u.participant_id=p_id) <> 1 THEN
        RAISE EXCEPTION 'item participant denominator incorrect';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tft_participants WHERE participant_id=p_id
        AND players_eliminated IS NULL AND total_damage_to_players IS NULL) THEN
        RAISE EXCEPTION 'missing counters must stay NULL';
    END IF;
    BEGIN
        INSERT INTO public.tft_matches (match_id, game_datetime, game_version, patch, queue_id)
            VALUES ('__schema_test_match__', 1789020000000, 'Version 16.18.1', '16.18', 1100);
        RAISE EXCEPTION 'match uniqueness failed';
    EXCEPTION WHEN unique_violation THEN NULL; END;
    BEGIN
        INSERT INTO public.tft_participants (match_id, puuid, placement, level, last_round)
            VALUES ('__schema_test_match__', '__schema_test_player__', 2, 8, 30);
        RAISE EXCEPTION 'participant uniqueness failed';
    EXCEPTION WHEN unique_violation THEN NULL; END;
    BEGIN
        INSERT INTO public.tft_units (participant_id, unit_index, character_id, tier, rarity)
            VALUES (p_id, 0, 'different', 1, 0);
        RAISE EXCEPTION 'unit slot uniqueness failed';
    EXCEPTION WHEN unique_violation THEN NULL; END;
    BEGIN
        INSERT INTO public.tft_unit_items (unit_id, item_index, item_name) VALUES (u_id, 0, 'different');
        RAISE EXCEPTION 'item slot uniqueness failed';
    EXCEPTION WHEN unique_violation THEN NULL; END;
    BEGIN
        INSERT INTO public.tft_traits (participant_id, name, num_units, tier_current, tier_total)
            VALUES (p_id, 'fixture_active', 4, 2, 4);
        RAISE EXCEPTION 'trait uniqueness failed';
    EXCEPTION WHEN unique_violation THEN NULL; END;
    BEGIN
        INSERT INTO public.tft_unit_items (unit_id, item_index, item_name) VALUES (-1, 0, 'orphan');
        RAISE EXCEPTION 'foreign key failed';
    EXCEPTION WHEN foreign_key_violation THEN NULL; END;
    BEGIN
        UPDATE public.tft_participants SET placement=9 WHERE participant_id=p_id;
        RAISE EXCEPTION 'placement check failed';
    EXCEPTION WHEN check_violation THEN NULL; END;
    BEGIN
        UPDATE public.tft_participants SET total_damage_to_players=-1 WHERE participant_id=p_id;
        RAISE EXCEPTION 'counter check failed';
    EXCEPTION WHEN check_violation THEN NULL; END;
    BEGIN
        UPDATE public.tft_matches SET patch='unknown' WHERE match_id='__schema_test_match__';
        RAISE EXCEPTION 'patch check failed';
    EXCEPTION WHEN check_violation THEN NULL; END;
    BEGIN
        UPDATE public.tft_matches SET ingestion_complete=true WHERE match_id='__schema_test_match__';
        RAISE EXCEPTION 'completion timestamp check failed';
    EXCEPTION WHEN check_violation THEN NULL; END;
    BEGIN
        DELETE FROM public.tft_players WHERE puuid='__schema_test_player__';
        RAISE EXCEPTION 'player history restriction failed';
    EXCEPTION WHEN foreign_key_violation OR restrict_violation THEN NULL; END;
    UPDATE public.tft_matches SET ingestion_complete=true, completed_at=now()
        WHERE match_id='__schema_test_match__';
    FOREACH t IN ARRAY ARRAY['tft_players','tft_matches','tft_participants','tft_units','tft_unit_items','tft_traits'] LOOP
        IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=('public.'||t)::regclass) THEN
            RAISE EXCEPTION 'RLS not enabled: %', t;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
            IF has_table_privilege('anon','public.'||t,'SELECT') OR has_table_privilege('anon','public.'||t,'INSERT') THEN
                RAISE EXCEPTION 'unexpected anon grant: %',t;
            END IF;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
            IF has_table_privilege('authenticated','public.'||t,'SELECT') THEN
                RAISE EXCEPTION 'unexpected authenticated grant: %',t;
            END IF;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
            IF NOT has_table_privilege('service_role','public.'||t,'INSERT') THEN
                RAISE EXCEPTION 'missing service role grant: %',t;
            END IF;
        END IF;
    END LOOP;
    DELETE FROM public.tft_matches WHERE match_id='__schema_test_match__';
    IF EXISTS (SELECT 1 FROM public.tft_participants WHERE participant_id=p_id)
        OR EXISTS (SELECT 1 FROM public.tft_units WHERE participant_id=p_id)
        OR EXISTS (SELECT 1 FROM public.tft_unit_items WHERE unit_id IN (u_id,other_unit_id))
        OR EXISTS (SELECT 1 FROM public.tft_traits WHERE participant_id=p_id) THEN
        RAISE EXCEPTION 'cascade tree deletion failed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tft_players WHERE puuid='__schema_test_player__') THEN
        RAISE EXCEPTION 'match deletion must preserve player identity';
    END IF;
END;
$test$;
ROLLBACK;
