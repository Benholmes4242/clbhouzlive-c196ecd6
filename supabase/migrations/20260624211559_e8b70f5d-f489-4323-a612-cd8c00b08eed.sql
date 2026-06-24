CREATE OR REPLACE FUNCTION public.get_course_hole_analysis(p_course_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_whs_course_id uuid;
  v_total_rounds int := 0;
  v_holes jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'unauthenticated');
  END IF;

  SELECT whs_course_id INTO v_whs_course_id
  FROM public.whs_to_golf_course_map
  WHERE golf_course_id = p_course_id
    AND (reviewed_at IS NOT NULL OR match_confidence >= 0.70)
  ORDER BY (reviewed_at IS NOT NULL) DESC, match_confidence DESC NULLS LAST
  LIMIT 1;

  IF v_whs_course_id IS NULL THEN
    RETURN jsonb_build_object('available', true, 'total_rounds', 0, 'holes', '[]'::jsonb);
  END IF;

  SELECT count(DISTINCT ws.id) INTO v_total_rounds
  FROM public.whs_scores ws
  JOIN public.whs_score_holes wsh ON wsh.score_id = ws.id
  WHERE ws.course_id = v_whs_course_id
    AND wsh.played = true
    AND wsh.actual_gross IS NOT NULL;

  SELECT jsonb_agg(h ORDER BY h_hole_no)
  INTO v_holes
  FROM (
    SELECT
      wsh.hole_no AS h_hole_no,
      jsonb_build_object(
        'hole_no', wsh.hole_no,
        'par', mode() WITHIN GROUP (ORDER BY wsh.par),
        'yards', mode() WITHIN GROUP (ORDER BY wsh.distance_yards),
        'stroke_index', mode() WITHIN GROUP (ORDER BY wsh.stroke_index),
        'rounds', count(*),
        'avg_to_par', round(avg(wsh.actual_gross - wsh.par)::numeric, 2),
        'avg_gross', round(avg(wsh.actual_gross)::numeric, 2),
        'dist', jsonb_build_object(
          'ace',       round(100.0 * count(*) FILTER (
                          WHERE wsh.actual_gross = 1) / count(*), 1),
          'albatross', round(100.0 * count(*) FILTER (
                          WHERE wsh.actual_gross <> 1
                            AND (wsh.actual_gross - wsh.par) = -3) / count(*), 1),
          'eagle',     round(100.0 * count(*) FILTER (
                          WHERE wsh.actual_gross <> 1
                            AND (wsh.actual_gross - wsh.par) = -2) / count(*), 1),
          'birdie',    round(100.0 * count(*) FILTER (
                          WHERE (wsh.actual_gross - wsh.par) = -1) / count(*), 1),
          'par',       round(100.0 * count(*) FILTER (
                          WHERE (wsh.actual_gross - wsh.par) = 0)  / count(*), 1),
          'bogey',     round(100.0 * count(*) FILTER (
                          WHERE (wsh.actual_gross - wsh.par) = 1)  / count(*), 1),
          'double',    round(100.0 * count(*) FILTER (
                          WHERE (wsh.actual_gross - wsh.par) >= 2) / count(*), 1)
        )
      ) AS h
    FROM public.whs_score_holes wsh
    JOIN public.whs_scores ws ON ws.id = wsh.score_id
    WHERE ws.course_id = v_whs_course_id
      AND wsh.played = true
      AND wsh.actual_gross IS NOT NULL
      AND wsh.par IS NOT NULL
    GROUP BY wsh.hole_no
  ) sub;

  RETURN jsonb_build_object(
    'available', true,
    'total_rounds', v_total_rounds,
    'holes', COALESCE(v_holes, '[]'::jsonb)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_course_hole_analysis(uuid) TO authenticated;