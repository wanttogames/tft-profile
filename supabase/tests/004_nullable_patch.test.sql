BEGIN;
DO $$
DECLARE body jsonb; saved boolean;
BEGIN
  SELECT jsonb_build_object('match_id','KR_999999999999004','game_datetime',1760000000123,
    'game_version','  opaque release label  ','patch',NULL,'queue_id',1100,
    'participants',jsonb_agg(jsonb_build_object('puuid','patch-test-'||i,'placement',i,'level',8,'last_round',30,
    'units',jsonb_build_array(jsonb_build_object('character_id','fixture-unit','tier',2,'rarity',1,'itemNames','[]'::jsonb)),
    'traits','[]'::jsonb))) INTO body FROM generate_series(1,8) AS i;
  saved := public.tft_save_match(body);
  IF saved IS DISTINCT FROM true THEN RAISE EXCEPTION 'Unknown patch should save'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.tft_matches WHERE match_id=body->>'match_id' AND patch IS NULL
    AND game_version='  opaque release label  ' AND ingestion_complete) THEN RAISE EXCEPTION 'Raw version/null patch not preserved'; END IF;
  IF (SELECT count(*) FROM public.tft_participants WHERE match_id=body->>'match_id') <> 8 THEN RAISE EXCEPTION 'Incomplete children'; END IF;
  BEGIN
    UPDATE public.tft_matches SET patch='invalid' WHERE match_id=body->>'match_id';
    RAISE EXCEPTION 'Non-null patch format must still be validated';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$$;
ROLLBACK;
