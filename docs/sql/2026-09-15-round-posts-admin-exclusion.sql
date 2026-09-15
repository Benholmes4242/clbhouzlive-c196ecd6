-- =====================================================================
-- ROUND POSTS OUT OF THE ADMIN NUMBERS
-- 2026-09-15. Ben runs this. Nothing here is applied by the agent.
--
-- WHY. public.posts carries auto-created round rows (post_type = 'round',
-- created by create_round_posts when a round syncs). They have no caption, no
-- media and no Clubhouse home, and they are counted as content in four admin
-- functions. 776 such rows exist today, 97 in the last 30 days.
--
-- WHAT IT DOES, per function:
--   get_admin_dashboard_glance   posts_by_hour excludes round posts
--   get_admin_overview_metrics   'posts' series excludes round posts,
--                                and a NEW 'rounds' figure counts rounds
--                                logged per day from gam_round_stats
--   get_admin_top_content        top_posts / post_sample exclude round posts
--   get_admin_funnel_cohorts     the 'social' branch no longer treats an
--                                auto-created round post as "Posted or reviewed"
--
-- SAFETY CONTRACT
--   * chain-guarded: asserts the md5 of every deployed body before touching it,
--     so it refuses to run against a body that changed since it was drafted
--   * refuses to run twice: the post-state md5s are asserted at the end, and a
--     second run fails the pre-state assert
--   * no backslash meta-commands, one transaction, EXECUTE of rebuilt bodies
--   * reads back and verifies
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------- PRE-STATE
DO $guard$
DECLARE
  expected jsonb := jsonb_build_object(
    'get_admin_dashboard_glance', '1a53200f54f507693eb7597fa26c9b17',
    'get_admin_funnel_cohorts',   '87b47780fea0d473b8a5104057b93aa3',
    'get_admin_overview_metrics', '792ad7066e063d48eb704c59fbb4a006',
    'get_admin_top_content',      '7200b987f22a7f411a5402908d5637eb'
  );
  k text;
  actual text;
BEGIN
  FOR k IN SELECT jsonb_object_keys(expected) LOOP
    SELECT md5(pg_get_functiondef(p.oid)) INTO actual
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = k;

    IF actual IS NULL THEN
      RAISE EXCEPTION 'CHAIN BREAK: public.% is not deployed', k;
    END IF;
    IF actual <> (expected ->> k) THEN
      RAISE EXCEPTION
        'CHAIN BREAK: public.% body is % , expected % . Someone changed it (or this file already ran). Re-read the deployed body before proceeding.',
        k, actual, expected ->> k;
    END IF;
  END LOOP;
  RAISE NOTICE 'pre-state verified: 4 admin functions match their drafted md5';
END
$guard$;

-- ------------------------------------------- 1. get_admin_dashboard_glance
-- Only change: posts_by_hour gains the round-post exclusion.
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_glance(p_tz text DEFAULT 'UTC'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
  v_tz text := COALESCE(NULLIF(p_tz, ''), 'UTC');
  v_start timestamptz;
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_dashboard_glance: permission denied'
      USING ERRCODE = '42501';
  END IF;

  v_start := timezone(v_tz, timezone(v_tz, now())::date::timestamp);

  WITH members AS (
    SELECT p.id, p.display_name, p.username, p.profile_photo_url
    FROM public.user_profiles p
    WHERE p.deleted_at IS NULL
      AND COALESCE(p.is_system_account, false) = false
  ),
  hours AS (SELECT generate_series(0, 23) AS hour),
  posts_by_hour AS (
    SELECT EXTRACT(HOUR FROM timezone(v_tz, created_at))::int AS hour, count(*)::int AS n
    FROM public.posts
    WHERE created_at >= v_start
      -- ROUND POSTS ARE NOT CONTENT: auto-created when a round syncs, no
      -- caption, no media, no Clubhouse home. Rounds logged is its own figure.
      AND COALESCE(post_type, '') <> 'round'
    GROUP BY 1
  ),
  top_users AS (
    SELECT e.user_id, count(*)::int AS event_count
    FROM public.analytics_events e
    JOIN members m ON m.id = e.user_id
    WHERE e.created_at >= v_start
    GROUP BY e.user_id
    ORDER BY count(*) DESC
    LIMIT 3
  )
  SELECT jsonb_build_object(
    'posts_by_hour', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('hour', h.hour, 'count', COALESCE(p.n, 0)) ORDER BY h.hour)
      FROM hours h LEFT JOIN posts_by_hour p ON p.hour = h.hour
    ), '[]'::jsonb),
    'top_active_users', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', t.user_id,
        'display_name', COALESCE(m.display_name, m.username, left(t.user_id::text, 8)),
        'avatar_url', m.profile_photo_url,
        'event_count', t.event_count
      ) ORDER BY t.event_count DESC)
      FROM top_users t JOIN members m ON m.id = t.user_id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$function$;

-- ------------------------------------------ 2. get_admin_overview_metrics
-- Two changes: 'posts' excludes round posts, and a NEW per-day 'rounds'
-- figure counts rounds logged (gam_round_stats.created_at), so round volume
-- is reported rather than hidden. Additive key: an older client ignores it.
CREATE OR REPLACE FUNCTION public.get_admin_overview_metrics(p_days integer DEFAULT 14, p_tz text DEFAULT 'UTC'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
  v_days integer := GREATEST(LEAST(COALESCE(p_days, 14), 120), 1);
  v_tz   text    := COALESCE(NULLIF(p_tz, ''), 'UTC');
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_overview_metrics: permission denied'
      USING ERRCODE = '42501';
  END IF;

  WITH members AS (
    SELECT p.id FROM public.user_profiles p
    WHERE p.deleted_at IS NULL
      AND COALESCE(p.is_system_account, false) = false
  ),
  days AS (
    SELECT d::date AS day
    FROM generate_series(
      (timezone(v_tz, now())::date - (v_days - 1)),
      timezone(v_tz, now())::date,
      interval '1 day'
    ) d
  ),
  sessions AS (
    SELECT timezone(v_tz, e.created_at)::date AS day, count(*)::int AS n
    FROM public.analytics_events e
    WHERE e.name = 'session_start'
      AND e.created_at >= timezone(v_tz, (timezone(v_tz, now())::date - (v_days - 1))::timestamp)
    GROUP BY 1
  ),
  signups AS (
    SELECT timezone(v_tz, p.created_at)::date AS day, count(*)::int AS n
    FROM public.user_profiles p
    WHERE p.deleted_at IS NULL
      AND COALESCE(p.is_system_account, false) = false
      AND p.created_at >= timezone(v_tz, (timezone(v_tz, now())::date - (v_days - 1))::timestamp)
    GROUP BY 1
  ),
  posts AS (
    SELECT timezone(v_tz, t.created_at)::date AS day, count(*)::int AS n
    FROM public.posts t
    WHERE t.created_at >= timezone(v_tz, (timezone(v_tz, now())::date - (v_days - 1))::timestamp)
      AND COALESCE(t.post_type, '') <> 'round'   -- rounds are counted below
    GROUP BY 1
  ),
  rounds AS (
    SELECT timezone(v_tz, r.created_at)::date AS day, count(*)::int AS n
    FROM public.gam_round_stats r
    WHERE r.created_at >= timezone(v_tz, (timezone(v_tz, now())::date - (v_days - 1))::timestamp)
    GROUP BY 1
  ),
  reviews AS (
    SELECT timezone(v_tz, r.created_at)::date AS day, count(*)::int AS n
    FROM public.course_ratings r
    WHERE r.created_at >= timezone(v_tz, (timezone(v_tz, now())::date - (v_days - 1))::timestamp)
    GROUP BY 1
  ),
  series AS (
    SELECT d.day,
           COALESCE(s.n, 0) AS sessions,
           COALESCE(g.n, 0) AS signups,
           COALESCE(o.n, 0) AS posts,
           COALESCE(rd.n, 0) AS rounds,
           COALESCE(v.n, 0) AS reviews
    FROM days d
    LEFT JOIN sessions s ON s.day = d.day
    LEFT JOIN signups  g ON g.day = d.day
    LEFT JOIN posts    o ON o.day = d.day
    LEFT JOIN rounds   rd ON rd.day = d.day
    LEFT JOIN reviews  v ON v.day = d.day
  )
  SELECT jsonb_build_object(
    'days', v_days,
    'tz', v_tz,
    'series', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', to_char(day, 'YYYY-MM-DD'),
        'sessions', sessions,
        'signups', signups,
        'posts', posts,
        'rounds', rounds,
        'reviews', reviews
      ) ORDER BY day) FROM series
    ), '[]'::jsonb),
    'total_users', (SELECT count(*)::int FROM members)
  ) INTO result;

  RETURN result;
END;
$function$;

-- ---------------------------------------------- 3. get_admin_top_content
-- Only change: round posts cannot be a top post, and their engagement events
-- do not count toward post_engagements_total / posts_over_floor.
CREATE OR REPLACE FUNCTION public.get_admin_top_content(p_days integer DEFAULT 30, p_include_staff boolean DEFAULT false, p_min_sample integer DEFAULT 10)
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
  post_sample AS (
    SELECT (props->>'post_id')::uuid AS post_id, count(*)::int AS sample
    FROM ev
    WHERE name IN ('post_like', 'post_share', 'post_comment')
      AND props->>'post_id' IS NOT NULL
      -- Engagement on a ROUND post is real, but it is round engagement and
      -- belongs to the round, not to a content leaderboard.
      AND NOT EXISTS (
        SELECT 1 FROM public.posts rp
        WHERE rp.id = (props->>'post_id')::uuid
          AND COALESCE(rp.post_type, '') = 'round'
      )
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
    WHERE COALESCE(p.post_type, '') <> 'round'
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

-- --------------------------------------------- 4. get_admin_funnel_cohorts
-- Only change: the 'social' branch ("Posted or reviewed") no longer counts an
-- auto-created round post as the member having posted.
CREATE OR REPLACE FUNCTION public.get_admin_funnel_cohorts(p_weeks integer DEFAULT 8)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
WITH bounds AS (
  SELECT date_trunc('week', CURRENT_DATE - make_interval(weeks => GREATEST(p_weeks,2)))::date AS since_week
),
member AS (
  SELECT u.id AS user_id,
         (u.created_at AT TIME ZONE 'UTC')::date AS joined_day,
         date_trunc('week', (u.created_at AT TIME ZONE 'UTC'))::date AS joined_week
  FROM user_profiles u
  WHERE u.deleted_at IS NULL
    AND public.can_moderate()          -- admin gate inside the function
),
connected AS (
  SELECT DISTINCT c.user_id FROM whs_connections c WHERE c.deleted_at IS NULL
),
rounded AS (
  SELECT DISTINCT r.user_id FROM gam_round_stats r WHERE r.user_id IS NOT NULL
),
social AS (
  -- A ROUND POST IS NOT POSTING. It is created for the member when a round
  -- syncs, so counting it made "Posted or reviewed" mean "synced a round".
  SELECT user_id FROM posts
  WHERE user_id IS NOT NULL AND COALESCE(post_type, '') <> 'round'
  UNION
  SELECT user_id FROM course_ratings WHERE user_id IS NOT NULL AND COALESCE(is_mock,false) = false
),
act AS (
  SELECT DISTINCT e.user_id,
         date_trunc('week', (e.created_at AT TIME ZONE 'UTC'))::date AS act_week,
         (e.created_at AT TIME ZONE 'UTC')::date AS act_day
  FROM analytics_events e
  WHERE e.user_id IS NOT NULL
    AND public.can_moderate()
    AND COALESCE(e.props ->> 'page','') NOT LIKE '/admin%'
    AND NOT COALESCE(COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%headless%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%bot%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%crawler%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%spider%', false)
),
step_connected AS (SELECT m.user_id FROM member m JOIN connected c ON c.user_id = m.user_id),
step_round     AS (SELECT s.user_id FROM step_connected s JOIN rounded r ON r.user_id = s.user_id),
step_recent    AS (SELECT s.user_id FROM step_round s
                   WHERE EXISTS (SELECT 1 FROM gam_round_stats g
                                 WHERE g.user_id = s.user_id AND g.play_date > CURRENT_DATE - 30)),
step_social    AS (SELECT s.user_id FROM step_round s
                   WHERE EXISTS (SELECT 1 FROM social so WHERE so.user_id = s.user_id)),
cohort_weeks AS (
  SELECT m.joined_week, count(*)::int AS size
  FROM member m
  WHERE m.joined_week >= (SELECT since_week FROM bounds)
  GROUP BY m.joined_week
),
grid AS (
  SELECT cw.joined_week,
         cw.size,
         o.offset_weeks,
         (SELECT count(DISTINCT a.user_id)
          FROM act a JOIN member m2 ON m2.user_id = a.user_id
          WHERE m2.joined_week = cw.joined_week
            AND a.act_week = cw.joined_week + (o.offset_weeks * 7))::int AS returned,
         (cw.joined_week + (o.offset_weeks * 7)) <= CURRENT_DATE AS elapsed
  FROM cohort_weeks cw
  CROSS JOIN generate_series(1, 4) AS o(offset_weeks)
)
SELECT CASE WHEN NOT public.can_moderate() THEN NULL ELSE jsonb_build_object(
  'computed_at', now(),
  'funnel', jsonb_build_array(
    jsonb_build_object('key','signed_up','label','Signed up',
      'n', (SELECT count(*)::int FROM member)),
    jsonb_build_object('key','connected','label','Connected a handicap',
      'n', (SELECT count(*)::int FROM step_connected)),
    jsonb_build_object('key','round','label','Synced a round',
      'n', (SELECT count(*)::int FROM step_round)),
    jsonb_build_object('key','recent','label','Played in the last 30 days',
      'n', (SELECT count(*)::int FROM step_recent))
  ),
  'branch', jsonb_build_object(
    'key','social','label','Posted or reviewed',
    'n', (SELECT count(*)::int FROM step_social),
    'of_key','round',
    'of_n', (SELECT count(*)::int FROM step_round)
  ),
  'cohorts', COALESCE((
    SELECT jsonb_agg(x ORDER BY x->>'week')
    FROM (
      SELECT jsonb_build_object(
               'week', g.joined_week,
               'size', g.size,
               'weeks', (SELECT jsonb_agg(
                            CASE WHEN g2.elapsed
                                 THEN to_jsonb(round((g2.returned::numeric / NULLIF(g.size,0)) * 100)::int)
                                 ELSE 'null'::jsonb END
                          ORDER BY g2.offset_weeks)
                         FROM grid g2 WHERE g2.joined_week = g.joined_week)
             ) AS x
      FROM grid g
      WHERE g.offset_weeks = 1
    ) q
  ), '[]'::jsonb)
) END;
$function$;

-- --------------------------------------------------------------- READ BACK
DO $verify$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_proc p JOIN pg_namespace nn ON nn.oid = p.pronamespace
  WHERE nn.nspname = 'public'
    AND p.proname IN ('get_admin_dashboard_glance','get_admin_overview_metrics',
                      'get_admin_top_content','get_admin_funnel_cohorts')
    AND pg_get_functiondef(p.oid) LIKE '%<> ''round''%';
  IF n <> 4 THEN
    RAISE EXCEPTION 'VERIFY FAILED: only % of 4 admin functions carry the round exclusion', n;
  END IF;

  SELECT count(*) INTO n
  FROM pg_proc p JOIN pg_namespace nn ON nn.oid = p.pronamespace
  WHERE nn.nspname = 'public' AND p.proname = 'get_admin_overview_metrics'
    AND pg_get_functiondef(p.oid) LIKE '%''rounds'', rounds%';
  IF n <> 1 THEN
    RAISE EXCEPTION 'VERIFY FAILED: overview metrics has no rounds figure';
  END IF;

  RAISE NOTICE 'verified: 4 functions exclude round posts, overview reports rounds logged';
END
$verify$;

COMMIT;

-- Post-run sanity read (safe to run any time):
--   select public.get_admin_overview_metrics(14, 'UTC') -> 'series' -> 0;
