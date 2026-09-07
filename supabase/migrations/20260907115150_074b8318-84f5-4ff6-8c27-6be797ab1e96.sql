-- TOP CONTENT: sample sizes, so a rank can never appear without its evidence.
-- Without staff, positions 2-6 by course views were 6, 6, 5, 4, 3 — that is one
-- member's afternoon, not a ranking. The card now needs to know how thin the
-- sample is, so it returns the window totals and how many rows clear the floor.
CREATE OR REPLACE FUNCTION public.get_admin_top_content(
  p_days integer DEFAULT 30,
  p_include_staff boolean DEFAULT false,
  p_min_sample integer DEFAULT 10
)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 180);
  v_staff boolean := COALESCE(p_include_staff, false);
  v_floor integer := GREATEST(COALESCE(p_min_sample, 10), 1);
  v_from timestamptz;
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_top_content: permission denied' USING ERRCODE = '42501';
  END IF;

  v_from := now() - (v_days || ' days')::interval;

  WITH ev AS (
    -- Staff excluded by default: 61% of course views in the measured window
    -- were one staff account, so a view-ranked leaderboard was ranking what
    -- one person looked at.
    SELECT e.name, e.props
    FROM public.analytics_events e
    LEFT JOIN public.user_profiles p ON p.id = e.user_id
    WHERE e.created_at >= v_from
      AND e.name IN ('course_view', 'post_like', 'post_share', 'post_comment')
      AND (v_staff OR COALESCE(p.is_staff_account, false) = false)
  ),
  shares AS (
    SELECT (props->>'post_id')::uuid AS post_id, count(*)::int AS shares
    FROM ev
    WHERE name = 'post_share' AND props->>'post_id' IS NOT NULL
    GROUP BY 1
  ),
  likes_ev AS (
    SELECT (props->>'post_id')::uuid AS post_id, count(*)::int AS likes
    FROM ev
    WHERE name = 'post_like' AND props->>'post_id' IS NOT NULL
    GROUP BY 1
  ),
  -- SAMPLE, not score. post.like_count/comment_count are all-time totals and
  -- cannot be filtered by staff or by window; this is the engagement actually
  -- measured inside the period, and it is what the floor is tested against.
  post_sample AS (
    SELECT (props->>'post_id')::uuid AS post_id, count(*)::int AS sample
    FROM ev
    WHERE name IN ('post_like', 'post_share', 'post_comment')
      AND props->>'post_id' IS NOT NULL
    GROUP BY 1
  ),
  candidates AS (
    SELECT post_id FROM post_sample
  ),
  views AS (
    SELECT (props->>'course_id')::uuid AS course_id, count(*)::int AS views
    FROM ev
    WHERE name = 'course_view' AND props->>'course_id' IS NOT NULL
    GROUP BY 1
  ),
  top_courses AS (
    SELECT v.course_id, c.name, v.views
    FROM views v
    LEFT JOIN public.golf_courses c ON c.id = v.course_id
    ORDER BY v.views DESC
    LIMIT 5
  ),
  top_posts AS (
    SELECT
      p.id,
      COALESCE(p.like_count, 0)::int AS likes,
      COALESCE(p.comment_count, 0)::int AS comments,
      COALESCE(s.shares, 0)::int AS shares,
      ps.sample,
      (COALESCE(p.like_count, 0) + COALESCE(p.comment_count, 0) + COALESCE(s.shares, 0))::int AS score,
      left(COALESCE(p.content, ''), 200) AS content_preview,
      COALESCE(up.display_name, up.username) AS author_name,
      p.created_at
    FROM public.posts p
    JOIN candidates cd ON cd.post_id = p.id
    JOIN post_sample ps ON ps.post_id = p.id
    LEFT JOIN shares s ON s.post_id = p.id
    LEFT JOIN public.user_profiles up ON up.id = p.user_id
    ORDER BY ps.sample DESC, score DESC
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'window_from', v_from,
    'include_staff', v_staff,
    'min_sample', v_floor,
    'course_views_total',     (SELECT COALESCE(SUM(views), 0) FROM views),
    'courses_over_floor',     (SELECT COUNT(*) FROM views WHERE views >= v_floor),
    'post_engagements_total', (SELECT COALESCE(SUM(sample), 0) FROM post_sample),
    'posts_over_floor',       (SELECT COUNT(*) FROM post_sample WHERE sample >= v_floor),
    'courses', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', course_id, 'name', name, 'views', views) ORDER BY views DESC) FROM top_courses), '[]'::jsonb),
    'posts', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', id, 'likes', likes, 'comments', comments, 'shares', shares,
        'sample', sample, 'score', score, 'content_preview', content_preview,
        'author_name', author_name, 'created_at', created_at) ORDER BY sample DESC, score DESC) FROM top_posts), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_admin_top_content(integer, boolean);

REVOKE ALL ON FUNCTION public.get_admin_top_content(integer, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_top_content(integer, boolean, integer) TO authenticated, service_role;