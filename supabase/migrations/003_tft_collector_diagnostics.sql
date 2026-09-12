-- Apply after 002. Replaces only RPC diagnostics; preserves atomic writes and grants.
BEGIN;
CREATE OR REPLACE FUNCTION public.tft_save_match(payload jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  p jsonb; u jsonb; t jsonb; item jsonb;
  pid bigint; uid bigint; ui integer; ii integer;
  inserted text;
  save_table text := 'tft_matches';
  error_code text; error_message text; error_details text; error_hint text;
BEGIN
  IF jsonb_typeof(payload->'participants') IS DISTINCT FROM 'array'
     OR jsonb_array_length(payload->'participants') <> 8
     OR (payload->>'queue_id')::integer IS DISTINCT FROM 1100 THEN
    RAISE EXCEPTION 'Expected eight ranked TFT participants';
  END IF;
  save_table := 'tft_matches';
    INSERT INTO public.tft_matches(match_id, game_datetime, game_version, patch, queue_id, platform, set_number)
  VALUES(payload->>'match_id', (payload->>'game_datetime')::bigint, payload->>'game_version',
    payload->>'patch', (payload->>'queue_id')::integer, 'kr', (payload->>'set_number')::smallint)
  ON CONFLICT (match_id) DO NOTHING RETURNING match_id INTO inserted;
  -- The unique index serializes competing insertions. Never overwrite any existing match.
  IF inserted IS NULL THEN RETURN false; END IF;
  FOR p IN SELECT value FROM jsonb_array_elements(payload->'participants') LOOP
    IF jsonb_typeof(p->'units') IS DISTINCT FROM 'array' OR jsonb_typeof(p->'traits') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Missing board arrays';
    END IF;
    save_table := 'tft_players';
    INSERT INTO public.tft_players(puuid) VALUES(p->>'puuid') ON CONFLICT (puuid) DO NOTHING;
    save_table := 'tft_participants';
    INSERT INTO public.tft_participants(match_id,puuid,placement,level,last_round,players_eliminated,
      total_damage_to_players,tier_at_collection,league_points_at_collection,rank_observed_at)
    VALUES(inserted,p->>'puuid',(p->>'placement')::smallint,(p->>'level')::smallint,(p->>'last_round')::smallint,
      (p->>'players_eliminated')::integer,(p->>'total_damage_to_players')::integer,p->>'tier_at_collection',
      (p->>'league_points_at_collection')::integer,(p->>'rank_observed_at')::timestamptz)
    RETURNING participant_id INTO pid;
    ui := 0;
    FOR u IN SELECT value FROM jsonb_array_elements(p->'units') LOOP
      IF jsonb_typeof(u->'itemNames') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Missing itemNames'; END IF;
      save_table := 'tft_units';
    INSERT INTO public.tft_units(participant_id,unit_index,character_id,tier,rarity)
      VALUES(pid,ui,u->>'character_id',(u->>'tier')::smallint,(u->>'rarity')::smallint)
      RETURNING unit_id INTO uid;
      ii := 0;
      FOR item IN SELECT value FROM jsonb_array_elements(u->'itemNames') LOOP
        IF jsonb_typeof(item) <> 'string' THEN RAISE EXCEPTION 'Invalid item name'; END IF;
        save_table := 'tft_unit_items';
    INSERT INTO public.tft_unit_items(unit_id,item_index,item_name) VALUES(uid,ii,item #>> '{}');
        ii := ii + 1;
      END LOOP;
      ui := ui + 1;
    END LOOP;
    FOR t IN SELECT value FROM jsonb_array_elements(p->'traits') LOOP
      save_table := 'tft_traits';
    INSERT INTO public.tft_traits(participant_id,name,num_units,tier_current,tier_total)
      VALUES(pid,t->>'name',(t->>'num_units')::smallint,(t->>'tier_current')::smallint,(t->>'tier_total')::smallint);
    END LOOP;
  END LOOP;
  save_table := 'tft_matches';
  UPDATE public.tft_matches SET ingestion_complete = true, completed_at = now() WHERE match_id = inserted;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS error_code = RETURNED_SQLSTATE,
    error_message = MESSAGE_TEXT, error_details = PG_EXCEPTION_DETAIL, error_hint = PG_EXCEPTION_HINT;
  RAISE EXCEPTION USING ERRCODE = error_code,
    MESSAGE = format('[table=%s] %s', save_table, error_message),
    DETAIL = coalesce(error_details, ''), HINT = coalesce(error_hint, '');
END;
$$;
REVOKE ALL ON FUNCTION public.tft_save_match(jsonb) FROM PUBLIC;
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.tft_save_match(jsonb) FROM %I',r);
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.tft_save_match(jsonb) TO service_role;
  END IF;
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
