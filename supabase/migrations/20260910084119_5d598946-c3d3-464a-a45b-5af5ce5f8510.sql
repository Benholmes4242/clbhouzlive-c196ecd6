CREATE OR REPLACE FUNCTION public.get_courses_by_round_volume(p_min_rounds int DEFAULT 10)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET timezone = 'Europe/London'
AS $$
  WITH s AS (
    SELECT sc.id, sc.course_id, sc.connection_id, sc.play_date
    FROM whs_scores sc
    JOIN whs_connections cn ON cn.id = sc.connection_id AND cn.deleted_at IS NULL
    JOIN user_profiles up ON up.id = cn.user_id
    WHERE sc.total_holes = 18
      AND sc.all_holes_attempted IS TRUE
      AND sc.course_id IS NOT NULL
      AND COALESCE(up.is_test, false) = false
      AND COALESCE(up.is_staff_account, false) = false
  ),
  agg AS (
    SELECT s.course_id,
           count(*)::int                          AS rounds,
           count(DISTINCT s.connection_id)::int    AS distinct_golfers,
           min(s.play_date)                        AS first_round_date,
           max(s.play_date)                        AS last_round_date,
           (SELECT count(DISTINCT h.hole_no)
              FROM whs_score_holes h
             WHERE h.score_id IN (SELECT id FROM s s2 WHERE s2.course_id = s.course_id)
               AND h.actual_gross IS NOT NULL
               AND h.hole_no BETWEEN 1 AND 18)::int AS holes_with_data
    FROM s
    GROUP BY s.course_id
    HAVING count(*) >= p_min_rounds
  )
  SELECT COALESCE(jsonb_agg(x ORDER BY x.rounds DESC, x.course_name), '[]'::jsonb)
  FROM (
    SELECT a.course_id,
           wc.name        AS course_name,
           cl.name        AS club_name,
           a.rounds,
           a.distinct_golfers,
           a.first_round_date,
           a.last_round_date,
           a.holes_with_data
    FROM agg a
    JOIN whs_courses wc ON wc.id = a.course_id
    LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = a.course_id
    LEFT JOIN golf_courses gc ON gc.id = m.golf_course_id
    LEFT JOIN golf_clubs cl ON cl.id = gc.club_id
  ) x;
$$;

REVOKE ALL ON FUNCTION public.get_courses_by_round_volume(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_courses_by_round_volume(int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_courses_by_round_volume(int) TO service_role;


CREATE OR REPLACE FUNCTION public.get_stroke_index_verdict(p_course_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET timezone = 'Europe/London'
AS $$
  WITH target AS (
    SELECT wc.id AS whs_course_id, wc.name AS course_name, cl.name AS club_name
    FROM whs_courses wc
    LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = wc.id
    LEFT JOIN golf_courses gc ON gc.id = m.golf_course_id
    LEFT JOIN golf_clubs cl ON cl.id = gc.club_id
    WHERE wc.id = p_course_id
    UNION ALL
    SELECT wc.id, wc.name, cl.name
    FROM golf_courses gc
    JOIN whs_to_golf_course_map m ON m.golf_course_id = gc.id
    JOIN whs_courses wc ON wc.id = m.whs_course_id
    LEFT JOIN golf_clubs cl ON cl.id = gc.club_id
    WHERE gc.id = p_course_id
    LIMIT 1
  ),
  s AS (
    SELECT sc.id, sc.connection_id, sc.play_date, sc.course_rating, sc.slope_rating,
           sc.handicap_index_at_time
    FROM whs_scores sc
    JOIN target t ON t.whs_course_id = sc.course_id
    JOIN whs_connections cn ON cn.id = sc.connection_id AND cn.deleted_at IS NULL
    JOIN user_profiles up ON up.id = cn.user_id
    WHERE sc.total_holes = 18
      AND sc.all_holes_attempted IS TRUE
      AND COALESCE(up.is_test, false) = false
      AND COALESCE(up.is_staff_account, false) = false
  ),
  hs AS (
    SELECT h.hole_no, h.par, h.distance_yards, h.stroke_index, h.actual_gross,
           s.handicap_index_at_time AS idx
    FROM whs_score_holes h
    JOIN s ON s.id = h.score_id
    WHERE h.hole_no BETWEEN 1 AND 18
      AND h.actual_gross IS NOT NULL
      AND h.par IS NOT NULL
  ),
  card AS (
    SELECT hole_no,
           mode() WITHIN GROUP (ORDER BY par)            AS par,
           mode() WITHIN GROUP (ORDER BY distance_yards) AS yardage,
           mode() WITHIN GROUP (ORDER BY stroke_index)   AS stroke_index
    FROM hs
    GROUP BY hole_no
  ),
  base AS (
    SELECT c.hole_no, c.par, c.yardage, c.stroke_index,
           count(*)::int                                          AS scores_counted,
           round(avg(hs.actual_gross)::numeric, 2)                AS avg_score,
           round(avg(hs.actual_gross - hs.par)::numeric, 2)       AS avg_to_par,
           round(100.0 * count(*) FILTER (WHERE hs.actual_gross - hs.par <= 0) / count(*), 1) AS pct_par_or_better,
           round(100.0 * count(*) FILTER (WHERE hs.actual_gross - hs.par = 1) / count(*), 1)  AS pct_bogey,
           round(100.0 * count(*) FILTER (WHERE hs.actual_gross - hs.par >= 2) / count(*), 1) AS pct_double_or_worse
    FROM card c
    JOIN hs ON hs.hole_no = c.hole_no
    GROUP BY c.hole_no, c.par, c.yardage, c.stroke_index
  ),
  ranked AS (
    SELECT b.*,
           rank() OVER (ORDER BY b.avg_to_par DESC, b.avg_score DESC)::int AS observed_rank
    FROM base b
  ),
  bands AS (
    SELECT hs.hole_no,
           CASE
             WHEN hs.idx <= 5.0  THEN 'plus_to_5'
             WHEN hs.idx <= 12.0 THEN 'band_5_1_to_12'
             WHEN hs.idx <= 20.0 THEN 'band_12_1_to_20'
             ELSE 'band_20_plus'
           END AS band,
           count(*)::int                                    AS scores_counted,
           round(avg(hs.actual_gross - hs.par)::numeric, 2)  AS avg_to_par
    FROM hs
    WHERE hs.idx IS NOT NULL
    GROUP BY 1, 2
  ),
  band_obj AS (
    SELECT k.hole_no,
           jsonb_object_agg(k.band, jsonb_build_object(
             'scores_counted', COALESCE(b.scores_counted, 0),
             'avg_to_par', b.avg_to_par
           )) AS by_handicap_band
    FROM (SELECT c.hole_no, x.band
            FROM card c
            CROSS JOIN (VALUES ('plus_to_5'),('band_5_1_to_12'),('band_12_1_to_20'),('band_20_plus')) x(band)) k
    LEFT JOIN bands b ON b.hole_no = k.hole_no AND b.band = k.band
    GROUP BY k.hole_no
  )
  SELECT jsonb_build_object(
    'course_name',       (SELECT course_name FROM target),
    'club_name',         (SELECT club_name FROM target),
    'par',               (SELECT sum(par)::int FROM card),
    'course_rating',     (SELECT mode() WITHIN GROUP (ORDER BY course_rating) FROM s WHERE course_rating IS NOT NULL),
    'slope',             (SELECT mode() WITHIN GROUP (ORDER BY slope_rating) FROM s WHERE slope_rating IS NOT NULL),
    'rounds_counted',    (SELECT count(*)::int FROM s),
    'distinct_golfers',  (SELECT count(DISTINCT connection_id)::int FROM s),
    'first_round_date',  (SELECT min(play_date) FROM s),
    'last_round_date',   (SELECT max(play_date) FROM s),
    'holes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'hole_number',         r.hole_no,
        'par',                 r.par,
        'yardage',             r.yardage,
        'stroke_index',        r.stroke_index,
        'scores_counted',      r.scores_counted,
        'avg_score',           r.avg_score,
        'avg_to_par',          r.avg_to_par,
        'observed_rank',       r.observed_rank,
        'si_gap',              (r.stroke_index - r.observed_rank),
        'pct_par_or_better',   r.pct_par_or_better,
        'pct_bogey',           r.pct_bogey,
        'pct_double_or_worse', r.pct_double_or_worse,
        'by_handicap_band',    bo.by_handicap_band
      ) ORDER BY r.hole_no)
      FROM ranked r
      LEFT JOIN band_obj bo ON bo.hole_no = r.hole_no
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_stroke_index_verdict(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_stroke_index_verdict(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_stroke_index_verdict(uuid) TO service_role;