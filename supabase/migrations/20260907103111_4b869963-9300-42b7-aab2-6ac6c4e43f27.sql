-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN RAW-READ REMEDIATION (batch 1)
-- PostgREST returns at most 2000 rows regardless of .limit(), so any admin
-- figure derived from a raw analytics_events select is wrong once the window
-- exceeds ~a day. Counting moves into Postgres. These functions aggregate and
-- return one row (or one row per member), never raw events.
-- Permission failure RAISEs — a NULL payload is indistinguishable from no data.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Overview metric series: per-day counts in the CALLER'S time zone so the
--    buckets line up with the browser's day keys.
CREATE OR REPLACE FUNCTION public.get_admin_overview_metrics(
  p_days integer DEFAULT 14,
  p_tz   text    DEFAULT 'UTC'
)
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
           COALESCE(v.n, 0) AS reviews
    FROM days d
    LEFT JOIN sessions s ON s.day = d.day
    LEFT JOIN signups  g ON g.day = d.day
    LEFT JOIN posts    o ON o.day = d.day
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
        'reviews', reviews
      ) ORDER BY day) FROM series
    ), '[]'::jsonb),
    'total_users', (SELECT count(*)::int FROM members)
  ) INTO result;

  RETURN result;
END;
$function$;

-- 2. Intraday: hourly counts for today and the same weekday last week.
CREATE OR REPLACE FUNCTION public.get_admin_intraday(p_tz text DEFAULT 'UTC')
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
  v_tz text := COALESCE(NULLIF(p_tz, ''), 'UTC');
  v_today_start timestamptz;
  v_last_start  timestamptz;
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_intraday: permission denied'
      USING ERRCODE = '42501';
  END IF;

  v_today_start := timezone(v_tz, timezone(v_tz, now())::date::timestamp);
  v_last_start  := timezone(v_tz, (timezone(v_tz, now())::date - 7)::timestamp);

  WITH hours AS (SELECT generate_series(0, 23) AS hour),
  today AS (
    SELECT EXTRACT(HOUR FROM timezone(v_tz, created_at))::int AS hour, count(*)::int AS n
    FROM public.analytics_events
    WHERE created_at >= v_today_start
    GROUP BY 1
  ),
  last AS (
    SELECT EXTRACT(HOUR FROM timezone(v_tz, created_at))::int AS hour, count(*)::int AS n
    FROM public.analytics_events
    WHERE created_at >= v_last_start
      AND created_at <  v_last_start + interval '1 day'
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'current_hour', EXTRACT(HOUR FROM timezone(v_tz, now()))::int,
    'hours', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'hour', h.hour,
        'today', COALESCE(t.n, 0),
        'last',  COALESCE(l.n, 0)
      ) ORDER BY h.hour)
      FROM hours h
      LEFT JOIN today t ON t.hour = h.hour
      LEFT JOIN last  l ON l.hour = h.hour
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$function$;

-- 3. Member last-activity map: one row per member with an event in the window.
--    Feeds the Members list last-seen column and the Active 24h / Dormant 14d
--    filters, so the list and the cards above it share one population.
CREATE OR REPLACE FUNCTION public.get_admin_member_last_seen(p_days integer DEFAULT 14)
RETURNS TABLE(user_id uuid, last_seen_at timestamptz, active_24h boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_days integer := GREATEST(LEAST(COALESCE(p_days, 14), 120), 1);
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_member_last_seen: permission denied'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH members AS (
    SELECT p.id FROM public.user_profiles p
    WHERE p.deleted_at IS NULL
      AND COALESCE(p.is_system_account, false) = false
  )
  SELECT e.user_id,
         max(e.created_at) AS last_seen_at,
         (max(e.created_at) >= now() - interval '24 hours') AS active_24h
  FROM public.analytics_events e
  JOIN members m ON m.id = e.user_id
  WHERE e.created_at >= now() - make_interval(days => v_days)
  GROUP BY e.user_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_admin_overview_metrics(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_intraday(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_member_last_seen(integer) TO authenticated;