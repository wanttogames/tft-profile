-- Run after 001 + 002, as postgres. Rolls back fixture data.
BEGIN;
DO $$
DECLARE body jsonb; broken jsonb; result boolean; n integer;
BEGIN
  SELECT jsonb_build_object('match_id','KR_900000000000001','game_datetime',1760000000123,
    'game_version','15.18.12345','patch','15.18','queue_id',1100,'set_number',15,
    'participants',jsonb_agg(jsonb_build_object('puuid','collector-test-' || i,'placement',i,
    'level',8,'last_round',30,'players_eliminated',NULL,'total_damage_to_players',0,
    'units',jsonb_build_array(jsonb_build_object('character_id','fixture-unit','tier',2,'rarity',4,
      'itemNames',jsonb_build_array('fixture-item','fixture-item'))),
    'traits',jsonb_build_array(jsonb_build_object('name','fixture-trait','num_units',2,'tier_current',1,'tier_total',3)))))
    INTO body FROM generate_series(1,8) AS i;
  result := public.tft_save_match(body);
  IF result IS DISTINCT FROM true THEN RAISE EXCEPTION 'Initial save failed'; END IF;
  result := public.tft_save_match(body);
  IF result IS DISTINCT FROM false THEN RAISE EXCEPTION 'Duplicate save was not skipped'; END IF;
  SELECT count(*) INTO n FROM public.tft_participants WHERE match_id=body->>'match_id';
  IF n <> 8 THEN RAISE EXCEPTION 'Expected 8 participants'; END IF;
  SELECT count(*) INTO n FROM public.tft_unit_items i JOIN public.tft_units u USING(unit_id)
    JOIN public.tft_participants p USING(participant_id) WHERE p.match_id=body->>'match_id';
  IF n <> 16 THEN RAISE EXCEPTION 'Duplicate equipped items must be preserved'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.tft_matches WHERE match_id=body->>'match_id' AND ingestion_complete AND completed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Missing completion marker';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.tft_participants WHERE match_id=body->>'match_id' AND players_eliminated IS NULL AND total_damage_to_players=0) THEN
    RAISE EXCEPTION 'Optional field handling incorrect';
  END IF;
  broken := jsonb_set(body,'{match_id}','"KR_900000000000002"');
  -- Fail near the end, after earlier participants and items have been inserted.
  broken := jsonb_set(broken,'{participants,7,units,0,tier}','0');
  BEGIN
    PERFORM public.tft_save_match(broken);
    RAISE EXCEPTION 'Expected invalid tier rejection';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF EXISTS(SELECT 1 FROM public.tft_matches WHERE match_id=broken->>'match_id') THEN
    RAISE EXCEPTION 'Failed RPC left a partial match';
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    IF has_function_privilege('anon','public.tft_save_match(jsonb)','EXECUTE') OR
       has_function_privilege('authenticated','public.tft_save_match(jsonb)','EXECUTE') THEN
      RAISE EXCEPTION 'Public RPC access must be denied';
    END IF;
    IF NOT has_function_privilege('service_role','public.tft_save_match(jsonb)','EXECUTE') THEN
      RAISE EXCEPTION 'Collector needs RPC access';
    END IF;
  END IF;
  DELETE FROM public.tft_matches WHERE match_id=body->>'match_id';
  IF EXISTS(SELECT 1 FROM public.tft_participants WHERE match_id=body->>'match_id') THEN RAISE EXCEPTION 'Cascade failed'; END IF;
END;
$$;
ROLLBACK;
