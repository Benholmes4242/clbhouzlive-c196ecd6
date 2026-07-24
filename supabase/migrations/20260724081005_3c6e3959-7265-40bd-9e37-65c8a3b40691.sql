DROP FUNCTION IF EXISTS public.gam_user_courses();

CREATE OR REPLACE FUNCTION public.gam_user_courses()
 RETURNS TABLE(
   course_id uuid,
   course_name text,
   rounds_count bigint,
   last_played timestamp with time zone,
   avg_to_par numeric,
   hardest_hole_no integer,
   hardest_hole_avg numeric,
   eagles_plus_pct numeric,
   birdies_pct numeric,
   pars_pct numeric,
   bogeys_plus_pct numeric,
   eagles_plus_count integer,
   birdies_count integer,
   pars_count integer,
   bogeys_plus_count integer,
   eagles_plus_pct_exact numeric,
   birdies_pct_exact numeric,
   pars_pct_exact numeric,
   bogeys_plus_pct_exact numeric
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
  holes_played AS (
    SELECT
      mapped.gc_id,
      (h.actual_gross - h.par) AS diff
    FROM mapped
    JOIN whs_score_holes h ON h.score_id = mapped.score_id
    WHERE h.played = true
      AND h.actual_gross IS NOT NULL
      AND h.par IS NOT NULL
  ),
  hole_agg AS (
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
  bucket_counts AS (
    SELECT
      gc_id,
      COUNT(*)                            AS total,
      COUNT(*) FILTER (WHERE diff <= -2)  AS c_eag,
      COUNT(*) FILTER (WHERE diff = -1)   AS c_bird,
      COUNT(*) FILTER (WHERE diff = 0)    AS c_par,
      COUNT(*) FILTER (WHERE diff >= 1)   AS c_bog
    FROM holes_played
    GROUP BY gc_id
  ),
  dist AS (
    SELECT
      gc_id,
      total,
      ROUND(100.0 * c_eag  / total)::int AS r_eag,
      ROUND(100.0 * c_bird / total)::int AS r_bird,
      ROUND(100.0 * c_par  / total)::int AS r_par,
      ROUND(100.0 * c_bog  / total)::int AS r_bog,
      (100.0 * c_eag  / total)::numeric AS x_eag,
      (100.0 * c_bird / total)::numeric AS x_bird,
      (100.0 * c_par  / total)::numeric AS x_par,
      (100.0 * c_bog  / total)::numeric AS x_bog,
      c_eag, c_bird, c_par, c_bog
    FROM bucket_counts
    WHERE total > 0
  ),
  dist_fixed AS (
    SELECT
      gc_id,
      (r_eag  + CASE WHEN largest = 'eag'  THEN delta ELSE 0 END)::numeric AS eagles_plus_pct,
      (r_bird + CASE WHEN largest = 'bird' THEN delta ELSE 0 END)::numeric AS birdies_pct,
      (r_par  + CASE WHEN largest = 'par'  THEN delta ELSE 0 END)::numeric AS pars_pct,
      (r_bog  + CASE WHEN largest = 'bog'  THEN delta ELSE 0 END)::numeric AS bogeys_plus_pct,
      c_eag::int  AS eagles_plus_count,
      c_bird::int AS birdies_count,
      c_par::int  AS pars_count,
      c_bog::int  AS bogeys_plus_count,
      x_eag  AS eagles_plus_pct_exact,
      x_bird AS birdies_pct_exact,
      x_par  AS pars_pct_exact,
      x_bog  AS bogeys_plus_pct_exact
    FROM (
      SELECT
        d.*,
        (100 - (r_eag + r_bird + r_par + r_bog)) AS delta,
        CASE
          WHEN c_par  >= c_bog  AND c_par  >= c_bird AND c_par  >= c_eag  THEN 'par'
          WHEN c_bog  >= c_bird AND c_bog  >= c_eag                       THEN 'bog'
          WHEN c_bird >= c_eag                                            THEN 'bird'
          ELSE                                                                 'eag'
        END AS largest
      FROM dist d
    ) x
  ),
  rounds AS (
    SELECT
      gc_id,
      COUNT(*)::bigint  AS rounds_count,
      MAX(capture_date) AS last_played
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
    cs.hardest_hole_avg,
    df.eagles_plus_pct,
    df.birdies_pct,
    df.pars_pct,
    df.bogeys_plus_pct,
    df.eagles_plus_count,
    df.birdies_count,
    df.pars_count,
    df.bogeys_plus_count,
    df.eagles_plus_pct_exact,
    df.birdies_pct_exact,
    df.pars_pct_exact,
    df.bogeys_plus_pct_exact
  FROM rounds r
  JOIN golf_courses gc ON gc.id = r.gc_id
  LEFT JOIN course_summary cs ON cs.gc_id = r.gc_id
  LEFT JOIN dist_fixed df ON df.gc_id = r.gc_id
  ORDER BY r.rounds_count DESC, r.last_played DESC NULLS LAST;
END;
$function$;

REVOKE ALL ON FUNCTION public.gam_user_courses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gam_user_courses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.gam_user_courses() TO service_role;