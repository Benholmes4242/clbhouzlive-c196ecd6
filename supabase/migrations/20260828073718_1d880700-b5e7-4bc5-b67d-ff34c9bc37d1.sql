CREATE OR REPLACE FUNCTION public.get_publication_stats(p_start timestamptz, p_end timestamptz)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d_start date := (p_start AT TIME ZONE 'Europe/London')::date;
  d_end   date := (p_end   AT TIME ZONE 'Europe/London')::date;
  v_result json;
BEGIN
  WITH members AS (
    SELECT up.id,
           COALESCE(NULLIF(up.first_name, ''), NULLIF(split_part(COALESCE(up.display_name,''), ' ', 1), ''), 'Member') AS first_name,
           NULLIF(upper(left(COALESCE(NULLIF(up.last_name,''), NULLIF(split_part(COALESCE(up.display_name,''), ' ', 2), '')), 1)), '') AS last_initial
    FROM public.user_profiles up
    WHERE COALESCE(up.is_test, false) = false
      AND up.deleted_at IS NULL
  ),
  rounds AS (
    SELECT g.whs_score_id,
           g.user_id,
           g.course_id,
           g.play_date,
           g.gross_score,
           g.score_diff,
           g.holes_played,
           w.handicap_index_at_time,
           c.name AS course_name
    FROM public.gam_round_stats g
    JOIN members m ON m.id = g.user_id
    JOIN public.golf_courses c ON c.id = g.course_id
    LEFT JOIN public.whs_scores w ON w.id = g.whs_score_id
    WHERE g.play_date BETWEEN d_start AND d_end
      AND COALESCE(w.all_holes_attempted, true) = true
  ),
  rounds18 AS (
    SELECT * FROM rounds WHERE holes_played = 18
  ),
  lowest_gross AS (
    SELECT json_build_object(
             'first_name', m.first_name,
             'last_initial', m.last_initial,
             'gross', r.gross_score,
             'course_name', r.course_name,
             'course_id', r.course_id,
             'played_on', r.play_date,
             'handicap_index', r.handicap_index_at_time
           ) AS obj
    FROM rounds18 r JOIN members m ON m.id = r.user_id
    WHERE r.gross_score IS NOT NULL
    ORDER BY r.gross_score ASC, r.play_date ASC
    LIMIT 1
  ),
  best_vs AS (
    SELECT json_build_object(
             'first_name', m.first_name,
             'last_initial', m.last_initial,
             'gross', r.gross_score,
             'course_name', r.course_name,
             'course_id', r.course_id,
             'played_on', r.play_date,
             'handicap_index', r.handicap_index_at_time,
             'differential', round(r.score_diff, 1),
             'to_handicap', round(r.handicap_index_at_time - r.score_diff, 1)
           ) AS obj
    FROM rounds18 r JOIN members m ON m.id = r.user_id
    WHERE r.score_diff IS NOT NULL AND r.handicap_index_at_time IS NOT NULL
    ORDER BY (r.handicap_index_at_time - r.score_diff) DESC, r.play_date ASC
    LIMIT 1
  ),
  snaps AS (
    SELECT wc.user_id, s.handicap_index, s.observed_at
    FROM public.whs_handicap_snapshots s
    JOIN public.whs_connections wc ON wc.id = s.connection_id
    JOIN members m ON m.id = wc.user_id
    WHERE wc.deleted_at IS NULL
      AND (s.observed_at AT TIME ZONE 'Europe/London')::date BETWEEN d_start AND d_end
  ),
  bounds AS (
    SELECT user_id,
           (array_agg(handicap_index ORDER BY observed_at ASC))[1] AS index_start,
           (array_agg(handicap_index ORDER BY observed_at DESC))[1] AS index_end
    FROM snaps
    GROUP BY user_id
  ),
  biggest_drop AS (
    SELECT json_build_object(
             'first_name', m.first_name,
             'last_initial', m.last_initial,
             'index_start', b.index_start,
             'index_end', b.index_end,
             'drop', round((b.index_start - b.index_end)::numeric, 1)
           ) AS obj
    FROM bounds b JOIN members m ON m.id = b.user_id
    WHERE b.index_start - b.index_end > 0
    ORDER BY (b.index_start - b.index_end) DESC
    LIMIT 1
  ),
  course_agg AS (
    SELECT course_id, course_name, count(*) AS rounds, avg(score_diff) AS avg_diff
    FROM rounds
    GROUP BY course_id, course_name
  ),
  most_played AS (
    SELECT json_build_object('course_name', course_name, 'course_id', course_id, 'rounds', rounds) AS obj
    FROM course_agg ORDER BY rounds DESC, course_name ASC LIMIT 1
  ),
  hardest AS (
    SELECT json_build_object('course_name', course_name, 'course_id', course_id, 'rounds', rounds,
                             'avg_differential', round(avg_diff, 1)) AS obj
    FROM course_agg WHERE rounds >= 5 AND avg_diff IS NOT NULL
    ORDER BY avg_diff DESC LIMIT 1
  ),
  review_agg AS (
    SELECT cr.course_id, c.name AS course_name, count(*) AS reviews, avg(cr.rating) AS avg_rating
    FROM public.course_ratings cr
    JOIN members m ON m.id = cr.user_id
    JOIN public.golf_courses c ON c.id = cr.course_id
    WHERE COALESCE(cr.is_mock, false) = false
      AND (COALESCE(cr.review_date, cr.created_at) AT TIME ZONE 'Europe/London')::date BETWEEN d_start AND d_end
    GROUP BY cr.course_id, c.name
  ),
  best_rated AS (
    SELECT json_build_object('course_name', course_name, 'course_id', course_id, 'reviews', reviews,
                             'avg_rating', round(avg_rating, 2)) AS obj
    FROM review_agg WHERE reviews >= 3
    ORDER BY avg_rating DESC, reviews DESC LIMIT 1
  )
  SELECT json_build_object(
    'window_start', d_start,
    'window_end', d_end,
    'rounds_logged', (SELECT count(*) FROM rounds),
    'golfers_played', (SELECT count(DISTINCT user_id) FROM rounds),
    'courses_played', (SELECT count(DISTINCT course_id) FROM rounds),
    'new_members', (SELECT count(*) FROM public.user_profiles up
                     WHERE COALESCE(up.is_test,false) = false AND up.deleted_at IS NULL
                       AND (up.created_at AT TIME ZONE 'Europe/London')::date BETWEEN d_start AND d_end),
    'lowest_gross', (SELECT obj FROM lowest_gross),
    'best_vs_handicap', (SELECT obj FROM best_vs),
    'biggest_handicap_drop', (SELECT obj FROM biggest_drop),
    'most_played_course', (SELECT obj FROM most_played),
    'hardest_course', (SELECT obj FROM hardest),
    'best_rated_course', (SELECT obj FROM best_rated)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_publication_stats(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_publication_stats(timestamptz, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.get_publication_stats(timestamptz, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_publication_stats(timestamptz, timestamptz) TO service_role;