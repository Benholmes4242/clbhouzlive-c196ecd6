CREATE OR REPLACE FUNCTION public.refresh_latest_records_cache(p_limit integer DEFAULT 8)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_payload jsonb;
  v_count   integer;
  v_region  text;
BEGIN
  -- No per-user cap anywhere: every course record shows regardless of holder.
  CREATE TEMP TABLE _records ON COMMIT DROP AS
  WITH eligible AS (
    SELECT
      v.course_id, v.course_name, v.category, v.value, v.user_id, v.attained_at,
      CASE v.category
        WHEN 'lowest_gross_all_time'     THEN 1
        WHEN 'best_stableford_all_time'  THEN 2
        ELSE 99
      END AS notability
    FROM gam_course_legends_view v
    WHERE v.is_current = true
      AND v.rank = 1
      AND v.category IN ('lowest_gross_all_time','best_stableford_all_time')
  ),
  per_course AS (
    SELECT DISTINCT ON (course_id)
      course_id, course_name, category, value, user_id, attained_at, notability
    FROM eligible
    ORDER BY course_id, notability ASC, attained_at DESC
  )
  SELECT
    c.course_id, c.course_name, c.category, c.value, c.user_id, c.attained_at,
    c.notability,
    gc.thumbnail_image,
    up.display_name       AS holder_name,
    up.username           AS holder_username,
    up.profile_photo_url  AS holder_avatar,
    up.eg_handicap_index  AS holder_hcp,
    up.home_club          AS holder_club,
    cp.course_par         AS course_par,
    sid.score_id          AS score_id,
    -- Feat stats for chips. LEFT JOIN: a missing stats row must never drop a record.
    grs.birdies           AS birdies,
    grs.eagles            AS eagles,
    grs.albatrosses       AS albatrosses,
    grs.holes_in_one      AS holes_in_one,
    grs.beat_par          AS beat_par,
    grs.clean_card        AS clean_card,
    CASE
      WHEN gc.country = 'Britain & Ireland' THEN 'gbi'
      WHEN gc.country = 'USA' THEN 'usa'
      WHEN gc.country = 'Continental Europe' THEN 'europe'
      WHEN gc.country IN ('Oceania','Asia','Africa','Caribbean','Middle East','Central and South America') THEN 'row'
      ELSE 'row'
    END AS region
  FROM per_course c
  LEFT JOIN golf_courses gc ON gc.id = c.course_id
  LEFT JOIN user_profiles up ON up.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT par_sum AS course_par
    FROM (
      SELECT SUM(h.par)::int AS par_sum
      FROM whs_to_golf_course_map m
      JOIN whs_scores ws ON ws.course_id = m.whs_course_id
      JOIN whs_score_holes h ON h.score_id = ws.id
      WHERE m.golf_course_id = c.course_id
      GROUP BY ws.id
      HAVING COUNT(h.hole_no) = 18
    ) round_pars
    WHERE par_sum BETWEEN 60 AND 75
    GROUP BY par_sum
    ORDER BY COUNT(*) DESC, par_sum ASC
    LIMIT 1
  ) cp ON true
  LEFT JOIN LATERAL (
    SELECT ws.id AS score_id
    FROM whs_to_golf_course_map m
    JOIN whs_scores ws ON ws.course_id = m.whs_course_id
    JOIN whs_connections wc ON wc.id = ws.connection_id AND wc.user_id = c.user_id
    WHERE m.golf_course_id = c.course_id
      AND (
        (c.category = 'lowest_gross_all_time'    AND ws.adjusted_gross    = c.value::int)
        OR
        (c.category = 'best_stableford_all_time' AND ws.stableford_points = c.value::int)
      )
    ORDER BY (ws.play_date = c.attained_at::date) DESC, ws.play_date DESC
    LIMIT 1
  ) sid ON true
  LEFT JOIN gam_round_stats grs ON grs.whs_score_id = sid.score_id
  WHERE up.deleted_at IS NULL;

  -- 1. Global latest strip (8 tiles, pure recency, no cap)
  SELECT
    COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.attained_at DESC), '[]'::jsonb),
    COUNT(*)
  INTO v_payload, v_count
  FROM (
    SELECT course_id, course_name, category, value, user_id, attained_at,
           thumbnail_image, holder_name, holder_username, holder_avatar,
           holder_hcp, holder_club, course_par, score_id,
           birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card
    FROM _records
    ORDER BY notability ASC, attained_at DESC
    LIMIT p_limit
  ) t;

  INSERT INTO public.discover_rail_cache (rail_key, payload, item_count, computed_at)
  VALUES ('latest_records', v_payload, v_count, now())
  ON CONFLICT (rail_key)
  DO UPDATE SET payload = EXCLUDED.payload,
                item_count = EXCLUDED.item_count,
                computed_at = EXCLUDED.computed_at;

  -- 2. Region-bucketed LATEST keys (records:{region}) -- pure recency, no cap
  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    INSERT INTO public.discover_rail_cache (rail_key, payload, item_count, computed_at)
    SELECT
      'records:' || v_region,
      COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.attained_at DESC), '[]'::jsonb),
      COUNT(*),
      now()
    FROM (
      SELECT course_id, course_name, category, value, user_id, attained_at,
             thumbnail_image, holder_name, holder_username, holder_avatar,
             holder_hcp, holder_club, course_par, score_id,
             birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card
      FROM _records r
      WHERE (v_region = 'worldwide' OR r.region = v_region)
      ORDER BY r.notability ASC, r.attained_at DESC
      LIMIT 500
    ) t
    ON CONFLICT (rail_key)
    DO UPDATE SET payload = EXCLUDED.payload,
                  item_count = EXCLUDED.item_count,
                  computed_at = EXCLUDED.computed_at;
  END LOOP;

  -- 3. Region-bucketed ALL-TIME keys (records_alltime:{region})
  FOR v_region IN SELECT unnest(ARRAY['worldwide','gbi','usa','europe','row'])
  LOOP
    INSERT INTO public.discover_rail_cache (rail_key, payload, item_count, computed_at)
    SELECT
      'records_alltime:' || v_region,
      COALESCE(
        jsonb_agg(
          to_jsonb(t)
          ORDER BY (t.value - t.course_par) ASC NULLS LAST,
                   t.value ASC,
                   t.attained_at ASC
        ),
        '[]'::jsonb
      ),
      COUNT(*),
      now()
    FROM (
      SELECT course_id, course_name, category, value, user_id, attained_at,
             thumbnail_image, holder_name, holder_username, holder_avatar,
             holder_hcp, holder_club, course_par, score_id,
             birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card
      FROM _records r
      WHERE (v_region = 'worldwide' OR r.region = v_region)
        AND r.category = 'lowest_gross_all_time'
      ORDER BY (r.value - r.course_par) ASC NULLS LAST,
               r.value ASC,
               r.attained_at ASC
      LIMIT 500
    ) t
    ON CONFLICT (rail_key)
    DO UPDATE SET payload = EXCLUDED.payload,
                  item_count = EXCLUDED.item_count,
                  computed_at = EXCLUDED.computed_at;
  END LOOP;
END;
$function$;