DO $$
DECLARE
  v_post_id uuid;
BEGIN
  INSERT INTO posts (
    user_id, actor_type, actor_id, post_type, status, visibility, content, created_at
  ) VALUES (
    'b8437384-291a-4d85-b81f-24c1068235dd',
    'system',
    'b8437384-291a-4d85-b81f-24c1068235dd',
    'tournament_result',
    'published',
    'anyone',
    null,
    now()
  ) RETURNING id INTO v_post_id;

  INSERT INTO tournament_result_meta (
    post_id, tournament_id, tournament_name, venue_name, venue_city, venue_country,
    tour_slug, tour_name, tour_priority, winner_name, winner_score, winner_score_display,
    winner_photo_url, winner_by, stat_eagles, stat_birdies, stat_pars, stat_bogeys,
    stat_driving_distance, stat_fairways_pct, stat_gir_pct, stat_putts, podium_rows, course_image_url
  ) VALUES (
    v_post_id,
    'c36fb1dc-f55c-40b6-bbdd-9dd04a85786b',
    'Arnold Palmer Invitational presented by Mastercard',
    'Arnold Palmer''s Bay Hill Club & Lodge',
    'Orlando',
    'USA',
    'pga',
    'PGA TOUR',
    800,
    'A. Bhatia',
    -15,
    '-15',
    null,
    'Won in playoff',
    1, 23, 38, 10,
    299, 61, 68, 1.72,
    '[{"position": 2, "label": "2", "players": [{"name": "D. Berger", "photoUrl": null, "score": "-15"}], "isTied": false}, {"position": 3, "label": "T3", "players": [{"name": "Player A", "photoUrl": null, "score": "-12"}, {"name": "Player B", "photoUrl": null, "score": "-12"}], "isTied": true}]'::jsonb,
    null
  );
END $$;