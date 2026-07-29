DROP FUNCTION IF EXISTS public.get_post_course_context(uuid[]);

CREATE OR REPLACE FUNCTION public.get_post_course_context(p_course_ids uuid[])
 RETURNS TABLE(course_id uuid, rounds_tracked integer, avg_over_par numeric, harder_than_pct integer, your_rounds integer, your_best integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH course_avgs AS (
    SELECT rs2.course_id AS cid, AVG(rs2.gross_score - rs2.course_par) AS avg_op
    FROM public.gam_round_stats rs2
    WHERE rs2.holes_played = 18
    GROUP BY rs2.course_id
    HAVING COUNT(*) >= 2
  ),
  base AS (
    SELECT
      gc.id AS cid,
      COUNT(rs.whs_score_id)::int AS rounds_tracked,
      ROUND(AVG(rs.gross_score - rs.course_par)::numeric, 1) AS avg_over_par,
      COUNT(rs.whs_score_id) FILTER (WHERE rs.user_id = auth.uid())::int AS your_rounds,
      MIN(rs.gross_score) FILTER (WHERE rs.user_id = auth.uid())::int AS your_best
    FROM public.golf_courses gc
    LEFT JOIN public.gam_round_stats rs
      ON rs.course_id = gc.id AND rs.holes_played = 18
    WHERE gc.id = ANY(p_course_ids)
    GROUP BY gc.id
  )
  SELECT
    b.cid,
    b.rounds_tracked,
    b.avg_over_par,
    (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE c.avg_op < b.avg_over_par) / NULLIF(COUNT(*), 0))::int
     FROM course_avgs c)
      AS harder_than_pct,
    b.your_rounds,
    b.your_best
  FROM base b;
$function$;

GRANT EXECUTE ON FUNCTION public.get_post_course_context(uuid[]) TO authenticated, anon, service_role;