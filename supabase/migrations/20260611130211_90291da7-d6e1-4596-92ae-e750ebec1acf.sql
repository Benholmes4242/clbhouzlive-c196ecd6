CREATE OR REPLACE FUNCTION public.get_course_meta(p_course_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_whs_course_id uuid;
  v_friend_ids uuid[];
  v_friend_rounds int := 0;
  v_your_rounds int := 0;
  v_your_best int;
  v_course_par int;
  v_yards int;
  v_avg_over_par numeric;
  v_cr numeric;
  v_slope int;
  v_hardest_hole jsonb;
  v_course_name text;
  v_course_region text;
  v_course_country text;
  v_course_type text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'unauthenticated');
  END IF;

  SELECT name, region, country, course_type::text
  INTO v_course_name, v_course_region, v_course_country, v_course_type
  FROM public.golf_courses
  WHERE id = p_course_id;

  SELECT whs_course_id INTO v_whs_course_id
  FROM public.whs_to_golf_course_map
  WHERE golf_course_id = p_course_id
    AND (reviewed_at IS NOT NULL OR match_confidence >= 0.70)
  ORDER BY
    (reviewed_at IS NOT NULL) DESC,
    match_confidence DESC NULLS LAST
  LIMIT 1;

  IF v_whs_course_id IS NULL THEN
    RETURN jsonb_build_object(
      'available', true,
      'course_name', v_course_name,
      'course_region', v_course_region,
      'course_country', v_course_country,
      'course_type', v_course_type,
      'friend_rounds', 0,
      'your_rounds', 0,
      'your_best', NULL,
      'course_par', NULL,
      'course_yards', NULL,
      'course_cr', NULL,
      'course_slope', NULL,
      'avg_over_par', NULL,
      'hardest_hole', NULL
    );
  END IF;

  SELECT array_agg(DISTINCT uid) INTO v_friend_ids
  FROM (
    SELECT v_user_id AS uid
    UNION
    SELECT friend_id FROM public.user_friends
      WHERE user_id = v_user_id AND status = 'accepted'
    UNION
    SELECT user_id FROM public.user_friends
      WHERE friend_id = v_user_id AND status = 'accepted'
  ) f;

  SELECT COUNT(*)::int INTO v_friend_rounds
  FROM public.whs_scores ws
  JOIN public.whs_connections wc ON wc.id = ws.connection_id
  WHERE ws.course_id = v_whs_course_id
    AND wc.deleted_at IS NULL
    AND wc.user_id = ANY(v_friend_ids);

  SELECT COUNT(*)::int, MIN(adjusted_gross)
  INTO v_your_rounds, v_your_best
  FROM public.whs_scores ws
  JOIN public.whs_connections wc ON wc.id = ws.connection_id
  WHERE ws.course_id = v_whs_course_id
    AND wc.deleted_at IS NULL
    AND wc.user_id = v_user_id
    AND ws.adjusted_gross IS NOT NULL;

  SELECT
    (SELECT SUM(par) FROM public.whs_score_holes WHERE score_id = ws.id),
    CASE
      WHEN (SELECT COUNT(*) FROM public.whs_score_holes
            WHERE score_id = ws.id AND distance_yards IS NOT NULL) >= 18
      THEN (SELECT SUM(distance_yards) FROM public.whs_score_holes
            WHERE score_id = ws.id AND distance_yards IS NOT NULL)
      ELSE NULL
    END,
    ws.course_rating,
    ws.slope_rating
  INTO v_course_par, v_yards, v_cr, v_slope
  FROM public.whs_scores ws
  WHERE ws.course_id = v_whs_course_id
    AND ws.course_rating IS NOT NULL
    AND ws.slope_rating IS NOT NULL
    AND ws.hole_by_hole_fetched = true
  ORDER BY ws.play_date DESC
  LIMIT 1;

  IF v_course_par IS NOT NULL THEN
    SELECT ROUND(AVG(ws.adjusted_gross - v_course_par)::numeric, 1)
    INTO v_avg_over_par
    FROM public.whs_scores ws
    JOIN public.whs_connections wc ON wc.id = ws.connection_id
    WHERE ws.course_id = v_whs_course_id
      AND wc.deleted_at IS NULL
      AND wc.user_id = ANY(v_friend_ids)
      AND ws.adjusted_gross IS NOT NULL;
  END IF;

  SELECT jsonb_build_object(
    'hole_no', hole_no,
    'par', par,
    'stroke_index', stroke_index
  )
  INTO v_hardest_hole
  FROM public.whs_score_holes wsh
  JOIN public.whs_scores ws ON ws.id = wsh.score_id
  WHERE ws.course_id = v_whs_course_id
    AND wsh.stroke_index = 1
  ORDER BY ws.play_date DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'available', true,
    'course_name', v_course_name,
    'course_region', v_course_region,
    'course_country', v_course_country,
    'course_type', v_course_type,
    'friend_rounds', v_friend_rounds,
    'your_rounds', v_your_rounds,
    'your_best', v_your_best,
    'course_par', v_course_par,
    'course_yards', v_yards,
    'course_cr', v_cr,
    'course_slope', v_slope,
    'avg_over_par', v_avg_over_par,
    'hardest_hole', v_hardest_hole
  );
END;
$function$;