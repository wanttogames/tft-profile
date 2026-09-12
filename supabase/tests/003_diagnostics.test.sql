BEGIN;
DO $$
DECLARE body jsonb; message text; code text;
BEGIN
  SELECT jsonb_build_object('match_id','KR_999999999999003','game_datetime',1760000000123,
    'game_version','15.18.12345','patch','15.18','queue_id',1100,
    'participants',jsonb_agg(jsonb_build_object('puuid','diagnostic-test-'||i,'placement',i,'level',8,'last_round',30,
    'units',jsonb_build_array(jsonb_build_object('character_id','fixture-unit','tier',0,'rarity',1,'itemNames','[]'::jsonb)),
    'traits','[]'::jsonb))) INTO body FROM generate_series(1,8) AS i;
  BEGIN
    PERFORM public.tft_save_match(body);
    RAISE EXCEPTION 'Expected failure';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS message=MESSAGE_TEXT, code=RETURNED_SQLSTATE;
    IF message NOT LIKE '[table=tft_units]%' OR code <> '23514' THEN RAISE EXCEPTION 'Missing table/code diagnostics'; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.tft_matches WHERE match_id=body->>'match_id') THEN RAISE EXCEPTION 'Partial match remains'; END IF;
END;
$$;
ROLLBACK;
