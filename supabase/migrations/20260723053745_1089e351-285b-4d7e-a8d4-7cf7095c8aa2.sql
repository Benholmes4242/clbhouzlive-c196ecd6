DROP FUNCTION IF EXISTS public.get_my_course_scoring_breakdown(uuid);

CREATE OR REPLACE FUNCTION public.get_my_course_scoring_breakdown(p_golf_course_id uuid)
 RETURNS TABLE(rounds integer, total_over_par numeric, avg_gross numeric, holes jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH conn AS (
  SELECT c.id
  FROM whs_connections c
  WHERE c.user_id = auth.uid() AND c.deleted_at IS NULL
  LIMIT 1
),
sb_scores AS (
  SELECT s.id
  FROM whs_scores s
  JOIN whs_to_golf_course_map m ON m.whs_course_id = s.course_id
  JOIN conn ON conn.id = s.connection_id
  WHERE m.golf_course_id = p_golf_course_id
    AND s.hole_by_hole_fetched = true
    AND COALESCE(s.is_nine_hole, false) = false
),
round_count AS (
  SELECT COUNT(*)::int AS n FROM sb_scores
),
round_totals AS (
  SELECT h.score_id, SUM(h.actual_gross)::numeric AS gross
  FROM whs_score_holes h
  JOIN sb_scores sc ON sc.id = h.score_id
  WHERE h.played = true
    AND h.actual_gross IS NOT NULL
    AND h.hole_no BETWEEN 1 AND 18
  GROUP BY h.score_id
  HAVING COUNT(*) = 18
),
avg_g AS (
  SELECT ROUND(AVG(gross)::numeric, 1) AS avg_gross FROM round_totals
),
per_hole AS (
  SELECT
    h.hole_no,
    MAX(h.par)::int AS par,
    COUNT(*)::int AS rounds_played,
    ROUND(AVG(h.actual_gross)::numeric, 2) AS avg_score,
    ROUND((AVG(h.actual_gross) - MAX(h.par))::numeric, 2) AS shots_over_par,
    COUNT(*) FILTER (WHERE h.actual_gross <= h.par)::int AS par_or_better,
    COUNT(*) FILTER (WHERE h.actual_gross = h.par + 1)::int AS bogeys,
    COUNT(*) FILTER (WHERE h.actual_gross >= h.par + 2)::int AS doubles_plus
  FROM whs_score_holes h
  JOIN sb_scores sc ON sc.id = h.score_id
  WHERE h.played = true
    AND h.actual_gross IS NOT NULL
    AND h.hole_no BETWEEN 1 AND 18
  GROUP BY h.hole_no
)
SELECT
  rc.n,
  ROUND(COALESCE(SUM(ph.shots_over_par), 0), 2),
  (SELECT avg_gross FROM avg_g),
  COALESCE(jsonb_agg(to_jsonb(ph) ORDER BY ph.hole_no) FILTER (WHERE ph.hole_no IS NOT NULL), '[]'::jsonb)
FROM round_count rc
LEFT JOIN per_hole ph ON TRUE
WHERE rc.n >= 1
GROUP BY rc.n;
$function$;