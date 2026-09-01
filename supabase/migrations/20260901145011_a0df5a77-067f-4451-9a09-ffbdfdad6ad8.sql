DROP FUNCTION IF EXISTS public.get_admin_ops_health(integer);

CREATE OR REPLACE FUNCTION public.get_admin_ops_health(p_days integer DEFAULT 7, p_build_id text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
WITH bounds AS (
  SELECT (now() - make_interval(days => GREATEST(p_days,1))) AS since,
         (now() - interval '24 hours')                        AS since_24h
),
ev AS (
  SELECT e.user_id, e.name, e.created_at,
         e.props ->> 'session_id' AS sid,
         COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) AS ua
  FROM analytics_events e
  WHERE e.created_at >= (SELECT since FROM bounds)
    AND public.can_moderate()
),
ev_tagged AS (
  SELECT *,
         (ua ILIKE '%headless%' OR ua ILIKE '%bot%' OR ua ILIKE '%crawler%'
          OR ua ILIKE '%spider%') AS is_bot,
         CASE
           WHEN ua ILIKE '%median%'                       THEN 'App (Median)'
           WHEN ua ILIKE '%iphone%' OR ua ILIKE '%ipad%'  THEN 'iOS browser'
           WHEN ua ILIKE '%android%'                      THEN 'Android browser'
           ELSE 'Desktop / other'
         END AS client
  FROM ev
),
members AS (
  SELECT count(*)::int AS total FROM user_profiles WHERE deleted_at IS NULL
),
conn AS (
  SELECT
    count(DISTINCT c.user_id)::int AS connected,
    count(DISTINCT c.user_id) FILTER (WHERE c.initial_sync_complete)::int AS synced,
    count(DISTINCT c.user_id) FILTER (WHERE NOT c.initial_sync_complete)::int AS syncing,
    count(DISTINCT c.user_id) FILTER (WHERE c.consecutive_failures > 0)::int AS failing,
    count(DISTINCT c.user_id) FILTER
      (WHERE c.created_at >= (SELECT since FROM bounds))::int AS connected_in_window
  FROM whs_connections c
  WHERE c.deleted_at IS NULL
),
queue_status AS (
  SELECT q.status, count(*)::int AS n FROM gam_evaluation_queue q GROUP BY q.status
),
queue AS (
  SELECT
    count(*) FILTER (WHERE q.processed_at IS NULL)::int AS unprocessed,
    COALESCE(EXTRACT(EPOCH FROM (now() - min(q.enqueued_at) FILTER (WHERE q.processed_at IS NULL)))::int, 0) AS oldest_wait_sec,
    COALESCE((
      SELECT percentile_disc(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (q2.processed_at - q2.enqueued_at))::int)
      FROM gam_evaluation_queue q2
      WHERE q2.processed_at IS NOT NULL
        AND q2.processed_at >= (SELECT since FROM bounds)
    ), 0) AS median_process_sec,
    count(*) FILTER (WHERE q.attempts > 1 AND q.processed_at IS NULL)::int AS retrying,
    count(*) FILTER (WHERE q.error IS NOT NULL AND q.processed_at IS NULL)::int AS errored
  FROM gam_evaluation_queue q
),
activity AS (
  SELECT
    count(*) FILTER (WHERE r.play_date >= (CURRENT_DATE - 6))::int  AS rounds_in_window,
    count(*) FILTER (WHERE r.play_date >= (CURRENT_DATE - 13)
                       AND r.play_date <  (CURRENT_DATE - 6))::int  AS rounds_prev_window,
    count(DISTINCT r.user_id) FILTER (WHERE r.play_date >= (CURRENT_DATE - 6))::int AS rounds_members
  FROM gam_round_stats r
),
rounds_daily AS (
  SELECT jsonb_agg(jsonb_build_object('date', d.day::date, 'n', COALESCE(c.n, 0))
                   ORDER BY d.day) AS series
  FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, interval '1 day') d(day)
  LEFT JOIN (
    SELECT play_date, count(*)::int AS n FROM gam_round_stats
    WHERE play_date >= CURRENT_DATE - 13 GROUP BY play_date
  ) c ON c.play_date = d.day::date
),
sess24 AS (
  SELECT count(DISTINCT e.props ->> 'session_id')::int AS sessions_24h
  FROM analytics_events e
  WHERE e.created_at >= (SELECT since_24h FROM bounds)
    AND e.props ->> 'session_id' IS NOT NULL
    AND COALESCE(e.props ->> 'page','') NOT LIKE '/admin%'
    AND NOT COALESCE(COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%headless%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%bot%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%crawler%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%spider%', false)
),
-- Errors are SEPARATED by build, never discarded. When the caller names its
-- build id, errors from any other (or unlabelled) build are reported on their
-- own lines: a rising outdated count is the signal the update mechanism is
-- failing, and it must not be mixed into the current build's rate.
err AS (
  SELECT
    count(*) FILTER (WHERE p_build_id IS NULL OR e.props ->> 'build_id' = p_build_id)::int AS errors_24h,
    count(DISTINCT e.user_id) FILTER (WHERE p_build_id IS NULL OR e.props ->> 'build_id' = p_build_id)::int AS users_hit_24h,
    count(*) FILTER (WHERE p_build_id IS NOT NULL AND COALESCE(e.props ->> 'build_id','') <> p_build_id)::int AS outdated_errors_24h,
    count(DISTINCT e.user_id) FILTER (WHERE p_build_id IS NOT NULL AND COALESCE(e.props ->> 'build_id','') <> p_build_id)::int AS outdated_users_24h
  FROM analytics_events e
  WHERE e.name = 'app_error' AND e.created_at >= (SELECT since_24h FROM bounds)
    AND COALESCE(e.props ->> 'page','') NOT LIKE '/admin%'
    AND NOT COALESCE(COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%headless%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%bot%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%crawler%'
          OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%spider%', false)
),
builds AS (
  SELECT count(DISTINCT COALESCE(e.props ->> 'build_id','(unlabelled)'))::int AS distinct_builds
  FROM analytics_events e
  WHERE e.name = 'app_error' AND e.created_at >= (SELECT since FROM bounds)
),
err_top AS (
  SELECT jsonb_agg(x ORDER BY (x->>'count')::int DESC) AS top
  FROM (
    SELECT jsonb_build_object('message', g.message, 'kind', g.kind, 'route', g.route,
                              'count', g.n, 'users', g.users, 'last', g.last_at) AS x
    FROM (
      SELECT COALESCE(NULLIF(e.props ->> 'message',''), 'Unlabelled error') AS message,
             COALESCE(NULLIF(e.props ->> 'kind',''), 'unknown')             AS kind,
             NULLIF(e.props ->> 'page','')                                  AS route,
             count(*)::int AS n, count(DISTINCT e.user_id)::int AS users,
             max(e.created_at) AS last_at
      FROM analytics_events e
      WHERE e.name = 'app_error' AND e.created_at >= (SELECT since FROM bounds)
        AND COALESCE(e.props ->> 'page','') NOT LIKE '/admin%'
        AND (p_build_id IS NULL OR e.props ->> 'build_id' = p_build_id)
        AND NOT COALESCE(COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%headless%'
              OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%bot%'
              OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%crawler%'
              OR COALESCE(NULLIF(e.props ->> 'ua',''), e.ua) ILIKE '%spider%', false)
      GROUP BY 1, 2, 3 ORDER BY count(*) DESC LIMIT 3
    ) g
  ) q
),
client_rows AS (
  SELECT client, count(DISTINCT user_id)::int AS members, count(DISTINCT sid)::int AS sessions
  FROM ev_tagged
  WHERE user_id IS NOT NULL AND NOT is_bot
  GROUP BY client
),
traffic AS (
  SELECT count(*)::int AS events,
         count(*) FILTER (WHERE user_id IS NULL)::int AS anonymous_events,
         count(DISTINCT sid) FILTER (WHERE is_bot)::int AS bot_sessions,
         count(DISTINCT sid) FILTER (WHERE user_id IS NOT NULL AND NOT is_bot)::int AS member_sessions,
         count(DISTINCT user_id)::int AS members
  FROM ev_tagged
)
SELECT CASE WHEN NOT public.can_moderate() THEN NULL ELSE jsonb_build_object(
  'window_days', GREATEST(p_days,1),
  'computed_at', now(),
  'build_id', p_build_id,
  'activation', jsonb_build_object(
     'members_total',       (SELECT total FROM members),
     'connected',           (SELECT connected FROM conn),
     'synced',              (SELECT synced FROM conn),
     'syncing',             (SELECT syncing FROM conn),
     'failing',             (SELECT failing FROM conn),
     'connected_in_window', (SELECT connected_in_window FROM conn)
  ),
  'pipeline', jsonb_build_object(
     'unprocessed',        (SELECT unprocessed FROM queue),
     'oldest_wait_sec',    (SELECT oldest_wait_sec FROM queue),
     'median_process_sec', (SELECT median_process_sec FROM queue),
     'retrying',           (SELECT retrying FROM queue),
     'errored',            (SELECT errored FROM queue),
     'by_status',          COALESCE((SELECT jsonb_object_agg(status, n) FROM queue_status), '{}'::jsonb)
  ),
  'activity', jsonb_build_object(
     'rounds_in_window',   (SELECT rounds_in_window   FROM activity),
     'rounds_prev_window', (SELECT rounds_prev_window FROM activity),
     'rounds_members',     (SELECT rounds_members     FROM activity),
     'daily',              COALESCE((SELECT series FROM rounds_daily), '[]'::jsonb)
  ),
  'errors', jsonb_build_object(
     'errors_24h',          (SELECT errors_24h FROM err),
     'users_hit_24h',       (SELECT users_hit_24h FROM err),
     'outdated_errors_24h', (SELECT outdated_errors_24h FROM err),
     'outdated_users_24h',  (SELECT outdated_users_24h FROM err),
     'distinct_builds',     (SELECT distinct_builds FROM builds),
     'sessions_24h',        (SELECT sessions_24h FROM sess24),
     'top',                 COALESCE((SELECT top FROM err_top), '[]'::jsonb)
  ),
  'clients', COALESCE((
     SELECT jsonb_agg(jsonb_build_object('client', client, 'members', members, 'sessions', sessions)
                      ORDER BY members DESC, sessions DESC)
     FROM client_rows), '[]'::jsonb),
  'traffic', (SELECT to_jsonb(t) FROM traffic t)
) END;
$function$;