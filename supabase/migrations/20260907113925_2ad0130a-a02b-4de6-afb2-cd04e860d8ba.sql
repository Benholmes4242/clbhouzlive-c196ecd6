-- 1. THE FLAG -------------------------------------------------------------
-- Same shape as is_system_account, DIFFERENT meaning:
--   is_system_account = not a person at all (service account). Excluded from
--     member figures entirely.
--   is_staff_account  = a real person who builds/runs the product. ALWAYS
--     counted as a member; excluded from EVENT-VOLUME figures by default,
--     because their usage is not representative. Never deleted.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_staff_account boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_profiles.is_staff_account IS
  'Staff (the people building/running clbhouz). Counted in member figures, excluded from event-volume figures unless "Include staff" is on. Never delete these accounts.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_staff
  ON public.user_profiles (id) WHERE is_staff_account;

UPDATE public.user_profiles
   SET is_staff_account = true
 WHERE id IN (
   '8c240997-b6a1-408c-a953-794bc17ee35c',  -- benholmes42  (Benjamin Holmes)
   '314366da-7472-44a5-988f-1a1a1553828d'   -- ThomasHolmes (Thomas Holmes)
 );

-- 2. AUDIENCES: members population unchanged (staff ARE members). Report the
--    staff head-count so the screen can say what the toggle covers.
CREATE OR REPLACE FUNCTION public.get_admin_audiences()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_audiences: permission denied'
      USING ERRCODE = '42501';
  END IF;

  WITH members AS (
    -- THE population. Staff are members; only the service account is excluded.
    SELECT p.id, p.created_at, p.is_suspended, COALESCE(p.is_staff_account, false) AS is_staff
    FROM public.user_profiles p
    WHERE p.deleted_at IS NULL
      AND COALESCE(p.is_system_account, false) = false
  ),
  ev AS (
    SELECT e.user_id, max(e.created_at) AS last_seen
    FROM public.analytics_events e
    JOIN members m ON m.id = e.user_id
    WHERE e.created_at >= now() - interval '30 days'
    GROUP BY e.user_id
  ),
  agg AS (
    SELECT
      (SELECT count(*) FROM members)                                            AS members,
      (SELECT count(*) FROM members WHERE is_staff)                             AS staff_accounts,
      (SELECT count(*) FROM members WHERE created_at >= now() - interval '7 days') AS new_this_week,
      (SELECT count(*) FROM ev WHERE last_seen >= now() - interval '24 hours')   AS active_24h,
      (SELECT count(*) FROM members m
         WHERE NOT EXISTS (SELECT 1 FROM ev WHERE ev.user_id = m.id
                            AND ev.last_seen >= now() - interval '14 days'))     AS dormant_14d,
      (SELECT count(DISTINCT w.user_id) FROM public.whs_connections w
         JOIN members m ON m.id = w.user_id)                                     AS eg_linked,
      (SELECT count(DISTINCT w.user_id) FROM public.whs_connections w
         JOIN members m ON m.id = w.user_id
        WHERE w.last_sync_status = 'auth_failed')                                AS eg_issues,
      (SELECT count(*) FROM members WHERE is_suspended IS TRUE)                  AS suspended,
      (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NULL)         AS incomplete_signups,
      (SELECT count(*) FROM ev WHERE last_seen >= CURRENT_DATE - 6)              AS wau,
      (SELECT count(*) FROM ev WHERE last_seen >= CURRENT_DATE - 29)             AS mau,
      (SELECT count(DISTINCT e.user_id) FROM public.analytics_events e
         JOIN members m ON m.id = e.user_id
        WHERE e.created_at >= CURRENT_DATE)                                      AS dau_today
  )
  SELECT to_jsonb(agg) INTO result FROM agg;

  RETURN result;
END;
$function$;

-- 3. EVENTS EXPLORER: staff-aware counts, non-staff-only alarm floor.
DROP FUNCTION IF EXISTS public.get_admin_event_aggregates(integer, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_admin_event_aggregates(integer, text, text, integer, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.get_admin_event_aggregates(
  p_days integer DEFAULT 30,
  p_search text DEFAULT NULL::text,
  p_sort text DEFAULT 'count'::text,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_stopped_min_count integer DEFAULT 25,
  p_stopped_min_users integer DEFAULT 2,
  p_include_staff boolean DEFAULT false
)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_days   integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 180); -- hard cap in the function
  v_limit  integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_sort   text    := COALESCE(NULLIF(p_sort, ''), 'count');
  v_search text    := NULLIF(btrim(COALESCE(p_search, '')), '');
  -- Volume floor on the alarm: silence only means something if the prior
  -- period was busy enough across enough DISTINCT NON-STAFF members.
  v_min_cnt integer := GREATEST(COALESCE(p_stopped_min_count, 25), 0);
  v_min_usr integer := GREATEST(COALESCE(p_stopped_min_users, 2), 0);
  -- Staff exclusion applies to COUNTS only. Two staff accounts are ~74% of all
  -- events, so with them in, the figures describe us and not the platform.
  v_staff boolean := COALESCE(p_include_staff, false);
  v_cur_from  timestamptz := now() - make_interval(days => v_days);
  v_prior_from timestamptz := now() - make_interval(days => v_days * 2);
  v_result jsonb;
BEGIN
  IF NOT can_moderate() THEN
    RAISE EXCEPTION 'get_admin_event_aggregates: permission denied'
      USING ERRCODE = '42501';
  END IF;

  WITH staff AS (
    SELECT p.id FROM public.user_profiles p WHERE COALESCE(p.is_staff_account, false)
  ),
  scoped AS (
    -- One pass over the window. is_staff is carried per row so the alarm floor
    -- can count non-staff members REGARDLESS of the include-staff toggle.
    SELECT e.name, e.created_at, e.user_id,
           (e.user_id IS NOT NULL AND EXISTS (SELECT 1 FROM staff s WHERE s.id = e.user_id)) AS is_staff
    FROM public.analytics_events e
    WHERE e.created_at >= v_prior_from
      AND (v_search IS NULL OR e.name ILIKE '%' || v_search || '%')
  ),
  counted AS (
    SELECT * FROM scoped WHERE v_staff OR NOT is_staff
  ),
  agg AS (
    SELECT
      c.name,
      COUNT(*) FILTER (WHERE c.created_at >= v_cur_from)                        AS cnt,
      COUNT(DISTINCT c.user_id) FILTER (WHERE c.created_at >= v_cur_from)       AS users,
      COUNT(*) FILTER (WHERE c.created_at < v_cur_from)                         AS prior_cnt,
      COUNT(DISTINCT c.user_id) FILTER (WHERE c.created_at < v_cur_from)        AS prior_users,
      MAX(c.created_at)                                                        AS last_seen_at
    FROM counted c
    GROUP BY c.name
  ),
  -- The ALARM basis. Always non-staff, whatever the toggle says: if one of the
  -- two prior members was staff, a single holiday would raise an alarm on a
  -- healthy event, and an event only staff ever fired is not an event the
  -- platform uses and must never be able to alarm.
  alarm AS (
    SELECT
      s.name,
      COUNT(*) FILTER (WHERE s.created_at < v_cur_from AND NOT s.is_staff)                  AS ns_prior_cnt,
      COUNT(DISTINCT s.user_id) FILTER (WHERE s.created_at < v_cur_from AND NOT s.is_staff) AS ns_prior_users,
      COUNT(*) FILTER (WHERE s.created_at >= v_cur_from AND NOT s.is_staff)                 AS ns_cnt
    FROM scoped s
    GROUP BY s.name
  ),
  shaped AS (
    SELECT
      a.name, a.cnt, a.users, a.prior_cnt, a.prior_users, a.last_seen_at,
      al.ns_prior_users,
      -- SILENT: fired in the prior window, nothing in this one. Reported, not alarmed.
      (a.prior_cnt > 0 AND a.cnt = 0) AS silent,
      -- STOPPED: silent for non-staff AND the prior non-staff period carried weight.
      (al.ns_prior_cnt >= v_min_cnt AND al.ns_prior_users >= v_min_usr AND al.ns_cnt = 0) AS stopped,
      CASE WHEN a.prior_cnt = 0 THEN NULL
           ELSE round(((a.cnt - a.prior_cnt)::numeric / a.prior_cnt) * 100, 1) END AS delta_count_pct,
      CASE WHEN a.prior_users = 0 THEN NULL
           ELSE round(((a.users - a.prior_users)::numeric / a.prior_users) * 100, 1) END AS delta_users_pct
    FROM agg a
    LEFT JOIN alarm al ON al.name = a.name
  ),
  ordered AS (
    SELECT * FROM shaped
    ORDER BY
      stopped DESC,                                              -- alarms first, always
      CASE WHEN v_sort = 'users'     THEN users        END DESC NULLS LAST,
      CASE WHEN v_sort = 'last_seen' THEN last_seen_at END DESC NULLS LAST,
      CASE WHEN v_sort = 'count'     THEN cnt          END DESC NULLS LAST,
      CASE WHEN v_sort = 'name'      THEN name         END ASC  NULLS LAST,
      cnt DESC, name ASC
    LIMIT v_limit OFFSET v_offset
  ),
  totals AS (
    SELECT
      COUNT(*)                                  AS distinct_names,
      COALESCE(SUM(cnt), 0)                     AS window_events,
      COUNT(*) FILTER (WHERE stopped)           AS stopped_names,
      COUNT(*) FILTER (WHERE silent)            AS silent_names
    FROM shaped
  )
  SELECT jsonb_build_object(
    'window_days',    v_days,
    'window_from',    v_cur_from,
    'prior_from',     v_prior_from,
    'sort',           v_sort,
    'search',         v_search,
    'limit',          v_limit,
    'offset',         v_offset,
    'include_staff',  v_staff,
    'stopped_min_count', v_min_cnt,
    'stopped_min_users', v_min_usr,
    'distinct_names', t.distinct_names,
    'stopped_names',  t.stopped_names,
    'silent_names',   t.silent_names,
    'window_events',  t.window_events,
    'staff_events',   (
      SELECT COUNT(*) FROM scoped s
      WHERE s.created_at >= v_cur_from AND s.is_staff
    ),
    -- Logged-out browsing. Real traffic, not loss: bots are blocked at write
    -- time, so a null user_id is a member (or visitor) with no session.
    'anon_events',    (
      SELECT COUNT(*) FROM scoped s
      WHERE s.created_at >= v_cur_from AND s.user_id IS NULL
    ),
    'anon_sessions',  (
      SELECT COUNT(DISTINCT s.name IS NOT NULL) * 0 + COUNT(DISTINCT (s2.props->>'session_id'))
      FROM public.analytics_events s2, LATERAL (SELECT 1) s
      WHERE s2.created_at >= v_cur_from AND s2.user_id IS NULL
        AND (v_search IS NULL OR s2.name ILIKE '%' || v_search || '%')
    ),
    'window_members', (
      SELECT COUNT(DISTINCT c.user_id) FROM counted c WHERE c.created_at >= v_cur_from
    ),
    'rows', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name',            o.name,
        'count',           o.cnt,
        'users',           o.users,
        'prior_count',     o.prior_cnt,
        'prior_users',     o.prior_users,
        'prior_users_non_staff', o.ns_prior_users,
        'delta_count_pct', o.delta_count_pct,
        'delta_users_pct', o.delta_users_pct,
        'stopped',         o.stopped,
        'silent',          o.silent,
        'first_seen_at',   (SELECT MIN(e2.created_at) FROM public.analytics_events e2 WHERE e2.name = o.name),
        'last_seen_at',    o.last_seen_at
      ))
      FROM ordered o
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM totals t;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_event_aggregates(integer, text, text, integer, integer, integer, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_event_aggregates(integer, text, text, integer, integer, integer, integer, boolean) TO authenticated, service_role;

-- 4. TOP CONTENT: rank on non-staff attention by default.
DROP FUNCTION IF EXISTS public.get_admin_top_content(integer);

CREATE OR REPLACE FUNCTION public.get_admin_top_content(
  p_days integer DEFAULT 30,
  p_include_staff boolean DEFAULT false
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
      AND e.name IN ('course_view', 'post_like', 'post_share')
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
    'include_staff', v_staff,
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

REVOKE ALL ON FUNCTION public.get_admin_top_content(integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_top_content(integer, boolean) TO authenticated, service_role;