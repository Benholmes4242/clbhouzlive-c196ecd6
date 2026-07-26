CREATE OR REPLACE FUNCTION public.refresh_discover_feats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_region text;
  v_tier   text;
BEGIN
  CREATE TEMP TABLE _feats ON COMMIT DROP AS
  WITH recent AS (
    SELECT
      s.id AS score_id, s.connection_id, s.course_id, s.play_date,
      s.is_nine_hole, s.adjusted_gross, s.stableford_points
    FROM whs_scores s
    WHERE s.adjusted_gross IS NOT NULL
  ),
  hole_feats AS (
    SELECT
      h.score_id,
      SUM(h.par) FILTER (WHERE h.played)                                     AS course_par,
      BOOL_OR(h.played AND h.actual_gross = 1)                              AS has_ace,
      MIN(h.hole_no) FILTER (WHERE h.played AND h.actual_gross = 1)          AS ace_hole,
      BOOL_OR(h.played AND h.actual_gross = h.par - 3)                       AS has_albatross,
      MIN(h.hole_no) FILTER (WHERE h.played AND h.actual_gross = h.par - 3)  AS albatross_hole,
      BOOL_OR(h.played AND h.actual_gross = h.par - 2)                       AS has_eagle,
      MIN(h.hole_no) FILTER (WHERE h.played AND h.actual_gross = h.par - 2)  AS eagle_hole,
      COUNT(*) FILTER (WHERE h.played AND h.actual_gross = h.par - 1)        AS birdie_count
    FROM whs_score_holes h
    GROUP BY h.score_id
  ),
  resolved AS (
    SELECT
      r.score_id, r.connection_id, r.play_date, r.adjusted_gross,
      hf.ace_hole, hf.albatross_hole, hf.eagle_hole,
      COALESCE(hf.birdie_count, 0) AS birdie_count,
      wfm.friend_user_id,
      up.display_name      AS friend_name,
      up.profile_photo_url AS friend_thumbnail_url,
      up.eg_handicap_index AS holder_hcp,
      COALESCE(wc.name, g.name, 'Golf course') AS course_name,
      g.thumbnail_image AS course_image,
      g.country AS course_country,
      CASE
        WHEN hf.has_ace       THEN 'ace'
        WHEN hf.has_albatross THEN 'albatross'
        WHEN hf.has_eagle     THEN 'eagle'
        WHEN COALESCE(hf.birdie_count,0) >= 4 THEN 'birdie_haul'
        ELSE NULL
      END AS feat_type,
      CASE
        WHEN hf.has_ace       THEN 'Hole ' || hf.ace_hole::text
        WHEN hf.has_albatross THEN 'Hole ' || hf.albatross_hole::text
        WHEN hf.has_eagle     THEN 'Hole ' || hf.eagle_hole::text
        WHEN COALESCE(hf.birdie_count,0) >= 4 THEN hf.birdie_count::text || ' birdies'
      END AS feat_value,
      CASE
        WHEN hf.has_ace       THEN hf.ace_hole
        WHEN hf.has_albatross THEN hf.albatross_hole
        WHEN hf.has_eagle     THEN hf.eagle_hole
      END AS hole_no,
      hd.par             AS hole_par,
      hd.distance_yards  AS hole_yards
    FROM recent r
    LEFT JOIN hole_feats hf ON hf.score_id = r.score_id
    LEFT JOIN LATERAL (
      SELECT hh.par, hh.distance_yards
      FROM whs_score_holes hh
      WHERE hh.score_id = r.score_id
        AND hh.hole_no = CASE
              WHEN hf.has_ace       THEN hf.ace_hole
              WHEN hf.has_albatross THEN hf.albatross_hole
              WHEN hf.has_eagle     THEN hf.eagle_hole
            END
      LIMIT 1
    ) hd ON true
    LEFT JOIN whs_courses wc ON wc.id = r.course_id
    LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = r.course_id
    LEFT JOIN golf_courses g ON g.id = m.golf_course_id
    LEFT JOIN LATERAL (
      SELECT friend_user_id, friend_name, friend_thumbnail_url
      FROM whs_friend_matches
      WHERE friend_connection_id = r.connection_id
        AND friend_user_id IS NOT NULL
      LIMIT 1
    ) wfm ON true
    LEFT JOIN user_profiles up ON up.id = wfm.friend_user_id
  )
  SELECT
    score_id, play_date, course_name, course_image, course_country,
    friend_user_id AS user_id, friend_name AS holder_name,
    friend_thumbnail_url AS holder_avatar,
    holder_hcp,
    birdie_count,
    feat_type, feat_value,
    hole_no, hole_par, hole_yards,
    (play_date >= CURRENT_DATE - INTERVAL '30 days')  AS in_30d,
    (play_date >= CURRENT_DATE - INTERVAL '90 days')  AS in_90d,
    (play_date >= CURRENT_DATE - INTERVAL '365 days') AS in_365d,
    CASE feat_type
      WHEN 'ace' THEN 'legendary'
      WHEN 'albatross' THEN 'legendary'
      WHEN 'eagle' THEN 'eagles'
      WHEN 'birdie_haul' THEN 'birdie_hauls'
    END AS tier,
    CASE
      WHEN course_country = 'Britain & Ireland' THEN 'gbi'
      WHEN course_country = 'USA' THEN 'usa'
      WHEN course_country = 'Continental Europe' THEN 'europe'
      WHEN course_country IN ('Oceania','Asia','Africa','Caribbean','Middle East','Central and South America') THEN 'row'
      ELSE 'row'
    END AS region
  FROM resolved
  WHERE feat_type IS NOT NULL;

  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    FOR v_tier IN SELECT unnest(ARRAY['legendary','eagles','birdie_hauls'])
    LOOP
      INSERT INTO discover_rail_cache (rail_key, payload, item_count, computed_at)
      SELECT
        'feats:' || v_region || ':' || v_tier,
        COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.play_date DESC), '[]'::jsonb),
        COUNT(*),
        now()
      FROM (
        WITH scoped AS (
          SELECT *
          FROM _feats f
          WHERE f.tier = v_tier
            AND (v_region = 'worldwide' OR f.region = v_region)
        ),
        counts AS (
          SELECT
            COUNT(*) FILTER (WHERE in_30d)  AS c30,
            COUNT(*) FILTER (WHERE in_90d)  AS c90,
            COUNT(*) FILTER (WHERE in_365d) AS c365
          FROM scoped
        )
        SELECT s.score_id, s.play_date, s.course_name, s.course_image,
               s.user_id, s.holder_name, s.holder_avatar, s.holder_hcp,
               s.birdie_count, s.feat_type, s.feat_value,
               s.hole_no, s.hole_par, s.hole_yards
        FROM scoped s, counts c
        WHERE
          (c.c30 >= 10 AND s.in_30d)
          OR (c.c30 < 10 AND c.c90 >= 10 AND s.in_90d)
          OR (c.c30 < 10 AND c.c90 < 10 AND c.c365 >= 10 AND s.in_365d)
          OR (c.c30 < 10 AND c.c90 < 10 AND c.c365 < 10)
        ORDER BY s.play_date DESC
        LIMIT 500
      ) t
      ON CONFLICT (rail_key) DO UPDATE
        SET payload = EXCLUDED.payload,
            item_count = EXCLUDED.item_count,
            computed_at = EXCLUDED.computed_at;
    END LOOP;
  END LOOP;

  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    INSERT INTO discover_rail_cache (rail_key, payload, item_count, computed_at)
    SELECT
      'feats_alltime:' || v_region || ':birdie_hauls',
      COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.birdie_count DESC, t.play_date DESC), '[]'::jsonb),
      COUNT(*),
      now()
    FROM (
      SELECT s.score_id, s.play_date, s.course_name, s.course_image,
             s.user_id, s.holder_name, s.holder_avatar, s.holder_hcp,
             s.birdie_count, s.feat_type, s.feat_value,
             s.hole_no, s.hole_par, s.hole_yards
      FROM _feats s
      WHERE s.tier = 'birdie_hauls'
        AND (v_region = 'worldwide' OR s.region = v_region)
      ORDER BY s.birdie_count DESC, s.play_date DESC
      LIMIT 500
    ) t
    ON CONFLICT (rail_key) DO UPDATE
      SET payload = EXCLUDED.payload,
          item_count = EXCLUDED.item_count,
          computed_at = EXCLUDED.computed_at;
  END LOOP;
END;
$function$;

SELECT public.refresh_discover_feats();