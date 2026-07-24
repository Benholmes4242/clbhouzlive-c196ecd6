-- Extend gam_user_courses() with per-course avg_to_par + hardest-hole fields.
-- Hole aggregation mirrors get_my_hole_performance exactly (same filters,
-- same par source, same rounding) so the sheet and Analytics tab never
-- disagree. The per-course avg_to_par is the SUM of the per-hole to-par
-- averages — this is the sum-of-parts of what the Analytics tab shows.

DROP FUNCTION IF EXISTS public.gam_user_courses();

CREATE OR REPLACE FUNCTION public.gam_user_courses()
RETURNS TABLE(
  course_id uuid,
  course_name text,
  rounds_count bigint,
  last_played timestamptz,
  avg_to_par numeric,
  hardest_hole_no int,
  hardest_hole_avg numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH mapped AS (
    SELECT
      COALESCE(m.golf_course_id, s.course_id) AS gc_id,
      s.id AS score_id,
      s.capture_date
    FROM whs_scores s
    JOIN whs_connections wc ON wc.id = s.connection_id AND wc.deleted_at IS NULL
    LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = s.course_id
    WHERE wc.user_id = v_uid
      AND s.is_penalty_score = false
      AND s.course_id IS NOT NULL
  ),
  hole_agg AS (
    -- Mirror of get_my_hole_performance: same filters, same rounding.
    SELECT
      mapped.gc_id,
      h.hole_no,
      ROUND(AVG(h.actual_gross - h.par)::numeric, 2) AS hole_avg
    FROM mapped
    JOIN whs_score_holes h ON h.score_id = mapped.score_id
    WHERE h.played = true
      AND h.actual_gross IS NOT NULL
      AND h.par IS NOT NULL
    GROUP BY mapped.gc_id, h.hole_no
  ),
  course_summary AS (
    SELECT
      gc_id,
      ROUND(SUM(hole_avg)::numeric, 2) AS avg_to_par,
      (array_agg(hole_no  ORDER BY hole_avg DESC, hole_no ASC))[1] AS hardest_hole_no,
      (array_agg(hole_avg ORDER BY hole_avg DESC, hole_no ASC))[1] AS hardest_hole_avg
    FROM hole_agg
    GROUP BY gc_id
  ),
  rounds AS (
    SELECT
      gc_id,
      COUNT(*)::bigint     AS rounds_count,
      MAX(capture_date)    AS last_played
    FROM mapped
    GROUP BY gc_id
  )
  SELECT
    gc.id,
    gc.name,
    r.rounds_count,
    r.last_played,
    cs.avg_to_par,
    cs.hardest_hole_no,
    cs.hardest_hole_avg
  FROM rounds r
  JOIN golf_courses gc ON gc.id = r.gc_id
  LEFT JOIN course_summary cs ON cs.gc_id = r.gc_id
  ORDER BY r.rounds_count DESC, r.last_played DESC NULLS LAST;
END;
$function$;

REVOKE ALL ON FUNCTION public.gam_user_courses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gam_user_courses() TO authenticated;