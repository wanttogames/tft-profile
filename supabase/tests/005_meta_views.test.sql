BEGIN;
DO $$
DECLARE a bigint; b bigint; u bigint; excluded bigint; excluded_match text; s record; baseline record;
BEGIN
 SELECT * INTO baseline FROM public.v_tft_meta_summary;
 INSERT INTO public.tft_players(puuid) VALUES('meta-test-a'),('meta-test-b');
 INSERT INTO public.tft_matches(match_id,game_datetime,game_version,patch,queue_id,ingestion_complete,completed_at)
 VALUES('KR_META_TEST1',1,'TFT Unreal Version ?.?.?.?',NULL,1100,true,now()),
 ('KR_META_TEST2',2,'TFT Unreal Version ?.?.?.?',NULL,1100,true,now()),
 ('KR_META_PENDING',3,'unknown',NULL,1100,false,NULL),('KR_META_OTHER',4,'unknown',NULL,1220,true,now());
 INSERT INTO public.tft_participants(match_id,puuid,placement,level,last_round) VALUES('KR_META_TEST1','meta-test-a',1,8,30) RETURNING participant_id INTO a;
 INSERT INTO public.tft_participants(match_id,puuid,placement,level,last_round) VALUES('KR_META_TEST2','meta-test-b',8,7,20) RETURNING participant_id INTO b;
 INSERT INTO public.tft_units(participant_id,unit_index,character_id,tier,rarity) VALUES(a,0,'meta-unit',1,1) RETURNING unit_id INTO u;
 INSERT INTO public.tft_unit_items(unit_id,item_index,item_name) VALUES(u,0,'meta-item'),(u,1,'meta-item');
 INSERT INTO public.tft_units(participant_id,unit_index,character_id,tier,rarity) VALUES(a,1,'meta-unit',3,1) RETURNING unit_id INTO u;
 INSERT INTO public.tft_unit_items(unit_id,item_index,item_name) VALUES(u,0,'meta-item');
 INSERT INTO public.tft_units(participant_id,unit_index,character_id,tier,rarity) VALUES(b,0,'meta-unit',3,1) RETURNING unit_id INTO u;
 INSERT INTO public.tft_unit_items(unit_id,item_index,item_name) VALUES(u,0,'meta-item');
 INSERT INTO public.tft_traits(participant_id,name,num_units,tier_current,tier_total) VALUES(a,'meta-trait',2,1,3),(b,'meta-trait',6,3,3),(a,'meta-inactive',1,0,3);
 FOREACH excluded_match IN ARRAY ARRAY['KR_META_PENDING','KR_META_OTHER'] LOOP
  INSERT INTO public.tft_participants(match_id,puuid,placement,level,last_round) VALUES(excluded_match,'meta-test-a',1,8,30) RETURNING participant_id INTO excluded;
  INSERT INTO public.tft_units(participant_id,unit_index,character_id,tier,rarity) VALUES(excluded,0,'meta-unit',3,1) RETURNING unit_id INTO u;
  INSERT INTO public.tft_unit_items(unit_id,item_index,item_name) VALUES(u,0,'meta-item');
 END LOOP;
 SELECT * INTO s FROM public.v_tft_item_stats WHERE item_name='meta-item';
 IF s.sample_count<>2 OR s.avg_placement<>4.5 OR s.top4_rate<>0.5 OR s.win_rate<>0.5 OR (s.common_champions->0->>'sample_count')::int<>2 THEN RAISE EXCEPTION 'Item duplicate weighting'; END IF;
 SELECT * INTO s FROM public.v_tft_champion_stats WHERE character_id='meta-unit';
 IF s.sample_count<>2 OR s.avg_placement<>4.5 OR s.avg_star_level<>2.5 OR (s.common_items->0->>'sample_count')::int<>2 THEN RAISE EXCEPTION 'Champion board weighting'; END IF;
 SELECT * INTO s FROM public.v_tft_trait_stats WHERE trait_name='meta-trait';
 IF s.sample_count<>2 OR s.avg_tier_current<>2 OR jsonb_array_length(s.tier_samples)<>2 THEN RAISE EXCEPTION 'Trait tiers'; END IF;
 IF EXISTS(SELECT 1 FROM public.v_tft_trait_stats WHERE trait_name='meta-inactive') THEN RAISE EXCEPTION 'Inactive trait included'; END IF;
 IF EXISTS(SELECT 1 FROM public.v_tft_item_stats WHERE item_name='meta-item' AND sample_count>=10) THEN RAISE EXCEPTION 'Minimum sample filter'; END IF;
 SELECT * INTO s FROM public.v_tft_meta_summary;
 IF s.match_count<>baseline.match_count+2 OR s.participant_count<>baseline.participant_count+2 OR s.player_count<>baseline.player_count+2 OR s.latest_collected_at IS NULL THEN RAISE EXCEPTION 'Summary scope/null patches'; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  IF has_table_privilege('anon','public.v_tft_item_stats','SELECT') OR has_table_privilege('authenticated','public.v_tft_meta_participants','SELECT') THEN RAISE EXCEPTION 'Public raw/view access'; END IF;
  IF NOT has_table_privilege('service_role','public.v_tft_item_stats','SELECT') THEN RAISE EXCEPTION 'Missing server grant'; END IF;
 END IF;
END;
$$;
ROLLBACK;
