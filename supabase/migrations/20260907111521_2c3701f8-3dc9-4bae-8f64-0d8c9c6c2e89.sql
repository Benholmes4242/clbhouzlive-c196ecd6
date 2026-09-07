CREATE OR REPLACE FUNCTION public.get_admin_top_content(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 180);
  v_from timestamptz;
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_top_content: permission denied' USING ERRCODE = '42501';
  END IF;

  v_from := now() - (v_days || ' days')::interval;

  WITH ev AS (
    SELECT e.name, e.props
    FROM public.analytics_events e
    WHERE e.created_at >= v_from
      AND e.name IN ('course_view', 'post_like', 'post_share')
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
  candidates AS (
    SELECT post_id FROM shares
    UNION
    SELECT post_id FROM likes_ev
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
      (COALESCE(p.like_count, 0) + COALESCE(p.comment_count, 0) + COALESCE(s.shares, 0))::int AS score,
      left(COALESCE(p.content, ''), 200) AS content_preview,
      COALESCE(up.display_name, up.username) AS author_name,
      p.created_at
    FROM public.posts p
    JOIN candidates cd ON cd.post_id = p.id
    LEFT JOIN shares s ON s.post_id = p.id
    LEFT JOIN public.user_profiles up ON up.id = p.user_id
    ORDER BY score DESC
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'window_from', v_from,
    'courses', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', course_id, 'name', name, 'views', views) ORDER BY views DESC) FROM top_courses), '[]'::jsonb),
    'posts', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', id, 'likes', likes, 'comments', comments, 'shares', shares,
        'score', score, 'content_preview', content_preview,
        'author_name', author_name, 'created_at', created_at) ORDER BY score DESC) FROM top_posts), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_top_content(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_top_content(integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_admin_member_activity(p_user_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 180);
  v_from date;
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_member_activity: permission denied' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'get_admin_member_activity: p_user_id is required' USING ERRCODE = '22004';
  END IF;

  v_from := CURRENT_DATE - (v_days - 1);

  WITH ev AS (
    SELECT e.created_at, e.name
    FROM public.analytics_events e
    WHERE e.user_id = p_user_id
      AND e.created_at >= v_from
  ),
  days AS (
    SELECT generate_series(v_from, CURRENT_DATE, interval '1 day')::date AS d
  ),
  per_day AS (
    SELECT d.d, COALESCE(count(ev.created_at), 0)::int AS n
    FROM days d
    LEFT JOIN ev ON ev.created_at::date = d.d
    GROUP BY d.d
  ),
  agg AS (
    SELECT
      (SELECT count(*)::int FROM ev)                                            AS total_events,
      (SELECT count(*)::int FROM ev WHERE name = 'session_start')               AS sessions,
      (SELECT max(created_at) FROM ev WHERE name = 'session_start')             AS last_session_at,
      (SELECT count(*)::int FROM per_day WHERE n > 0)                           AS active_days
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'total_events', a.total_events,
    'sessions', a.sessions,
    'last_session_at', a.last_session_at,
    'active_days', a.active_days,
    'avg_per_active_day', CASE WHEN a.active_days > 0
      THEN round((a.total_events::numeric / a.active_days), 1) ELSE 0 END,
    'daily', COALESCE((SELECT jsonb_agg(jsonb_build_object('date', d, 'count', n) ORDER BY d)
                       FROM per_day), '[]'::jsonb)
  ) INTO result
  FROM agg a;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_member_activity(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_member_activity(uuid, integer) TO authenticated, service_role;