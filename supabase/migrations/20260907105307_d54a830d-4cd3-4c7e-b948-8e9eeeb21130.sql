-- ─────────────────────────────────────────────────────────────────────────────
-- Events Explorer: server-side aggregation.
-- This screen is an INSTRUMENTATION surface: presence and continuity of events,
-- not behaviour measurement (Overview / North Star / Audiences / Screens /
-- Funnels own that). Every figure carries its distinct-member sample.
-- Search is by event NAME only: there is no GIN index on analytics_events.props
-- (only narrow expression indexes on props->>'path'/'tag'/'user_id'), so a
-- containment search over ~226k rows would be an unindexed scan. Properties are
-- read in the drill-down instead, which returns the full props payload.
-- Indexes relied on: ae_name_time_idx / idx_ae_name_created (name, created_at),
-- analytics_events_created_at_idx (created_at DESC).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_admin_event_aggregates(
  p_days integer DEFAULT 30,
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'count',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days   integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 180); -- hard cap in the function
  v_limit  integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_sort   text    := COALESCE(NULLIF(p_sort, ''), 'count');
  v_search text    := NULLIF(btrim(COALESCE(p_search, '')), '');
  v_cur_from  timestamptz := now() - make_interval(days => v_days);
  v_prior_from timestamptz := now() - make_interval(days => v_days * 2);
  v_result jsonb;
BEGIN
  IF NOT can_moderate() THEN
    RAISE EXCEPTION 'get_admin_event_aggregates: permission denied'
      USING ERRCODE = '42501';
  END IF;

  WITH agg AS (
    SELECT
      e.name,
      COUNT(*) FILTER (WHERE e.created_at >= v_cur_from)                       AS cnt,
      COUNT(DISTINCT e.user_id) FILTER (WHERE e.created_at >= v_cur_from)      AS users,
      COUNT(*) FILTER (WHERE e.created_at < v_cur_from)                        AS prior_cnt,
      COUNT(DISTINCT e.user_id) FILTER (WHERE e.created_at < v_cur_from)       AS prior_users,
      MAX(e.created_at)                                                       AS last_seen_at
    FROM public.analytics_events e
    WHERE e.created_at >= v_prior_from
      AND (v_search IS NULL OR e.name ILIKE '%' || v_search || '%')
    GROUP BY e.name
  ),
  shaped AS (
    SELECT
      name, cnt, users, prior_cnt, prior_users, last_seen_at,
      -- STOPPED: fired in the prior window, silent in the current one. A release
      -- broke tracking. This is the state the screen exists to surface.
      (prior_cnt > 0 AND cnt = 0) AS stopped,
      CASE WHEN prior_cnt = 0 THEN NULL
           ELSE round(((cnt - prior_cnt)::numeric / prior_cnt) * 100, 1) END AS delta_count_pct,
      CASE WHEN prior_users = 0 THEN NULL
           ELSE round(((users - prior_users)::numeric / prior_users) * 100, 1) END AS delta_users_pct
    FROM agg
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
      COUNT(*) FILTER (WHERE stopped)           AS stopped_names
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
    'distinct_names', t.distinct_names,
    'stopped_names',  t.stopped_names,
    'window_events',  t.window_events,
    'window_members', (
      SELECT COUNT(DISTINCT e.user_id)
      FROM public.analytics_events e
      WHERE e.created_at >= v_cur_from
        AND (v_search IS NULL OR e.name ILIKE '%' || v_search || '%')
    ),
    'rows', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name',            o.name,
        'count',           o.cnt,
        'users',           o.users,
        'prior_count',     o.prior_cnt,
        'prior_users',     o.prior_users,
        'delta_count_pct', o.delta_count_pct,
        'delta_users_pct', o.delta_users_pct,
        'stopped',         o.stopped,
        'last_seen_at',    o.last_seen_at
      ))
      FROM ordered o
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM totals t;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_admin_event_aggregates(integer, text, text, integer, integer) IS
  'Events Explorer aggregate page. Instrumentation surface: presence + continuity. p_days capped at 180 in-function. Sorts stopped events first. Search matches name only (no GIN on props).';

-- ── Per-event daily history (sparkline): count AND distinct members ───────────
CREATE OR REPLACE FUNCTION public.get_admin_event_daily(
  p_name text,
  p_days integer DEFAULT 30,
  p_tz text DEFAULT 'UTC'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 180);
  v_tz   text    := COALESCE(NULLIF(p_tz, ''), 'UTC');
  v_result jsonb;
BEGIN
  IF NOT can_moderate() THEN
    RAISE EXCEPTION 'get_admin_event_daily: permission denied' USING ERRCODE = '42501';
  END IF;

  WITH days AS (
    SELECT (date_trunc('day', now() AT TIME ZONE v_tz)::date - offs) AS d
    FROM generate_series(0, v_days - 1) AS offs
  ),
  ev AS (
    SELECT (e.created_at AT TIME ZONE v_tz)::date AS d,
           e.user_id
    FROM public.analytics_events e
    WHERE e.name = p_name
      AND e.created_at >= now() - make_interval(days => v_days)
  )
  SELECT jsonb_build_object(
    'name', p_name,
    'window_days', v_days,
    'points', COALESCE(jsonb_agg(jsonb_build_object(
      'date',  x.d,
      'count', x.c,
      'users', x.u
    ) ORDER BY x.d), '[]'::jsonb)
  )
  INTO v_result
  FROM (
    SELECT days.d,
           COUNT(ev.d)                 AS c,
           COUNT(DISTINCT ev.user_id)  AS u
    FROM days LEFT JOIN ev ON ev.d = days.d
    GROUP BY days.d
  ) x;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_admin_event_daily(text, integer, text) IS
  'Per-event daily count and distinct-member sparkline. Max 180 points.';

-- ── Drill-down: keyset-paged raw rows WITH the full props payload ─────────────
-- app_error is worthless without message/stack/build, and those live in props.
CREATE OR REPLACE FUNCTION public.get_admin_event_occurrences(
  p_name text,
  p_days integer DEFAULT 30,
  p_before_at timestamptz DEFAULT NULL,
  p_before_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days  integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 180);
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_result jsonb;
BEGIN
  IF NOT can_moderate() THEN
    RAISE EXCEPTION 'get_admin_event_occurrences: permission denied' USING ERRCODE = '42501';
  END IF;

  WITH page AS (
    SELECT e.id, e.user_id, e.created_at, e.props
    FROM public.analytics_events e
    WHERE e.name = p_name
      AND e.created_at >= now() - make_interval(days => v_days)
      AND (
        p_before_at IS NULL
        OR e.created_at < p_before_at
        OR (e.created_at = p_before_at AND p_before_id IS NOT NULL AND e.id < p_before_id)
      )
    ORDER BY e.created_at DESC, e.id DESC
    LIMIT v_limit
  )
  SELECT jsonb_build_object(
    'name', p_name,
    'limit', v_limit,
    'rows', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id, 'user_id', p.user_id, 'created_at', p.created_at, 'props', p.props
      ) ORDER BY p.created_at DESC, p.id DESC)
      FROM page p
    ), '[]'::jsonb),
    'next_before_at', (SELECT MIN(created_at) FROM page),
    'next_before_id', (
      SELECT id FROM page ORDER BY created_at ASC, id ASC LIMIT 1
    ),
    'has_more', (SELECT COUNT(*) FROM page) = v_limit
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_admin_event_occurrences(text, integer, timestamptz, uuid, integer) IS
  'Keyset-paged (created_at, id) raw drill-down. Returns the FULL props payload: app_error needs message/stack/build.';

-- ── app_error grouped by MESSAGE + BUILD, not by name ────────────────────────
-- All app_error rows share one name, so name-grouping renders the single most
-- valuable diagnostic on the screen as one useless row.
CREATE OR REPLACE FUNCTION public.get_admin_app_errors(
  p_days integer DEFAULT 30,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days   integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 180);
  v_limit  integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_cur_from timestamptz := now() - make_interval(days => v_days);
  v_result jsonb;
BEGIN
  IF NOT can_moderate() THEN
    RAISE EXCEPTION 'get_admin_app_errors: permission denied' USING ERRCODE = '42501';
  END IF;

  WITH src AS (
    SELECT
      COALESCE(
        NULLIF(btrim(e.props ->> 'message'), ''),
        NULLIF(btrim(e.props ->> 'error'), ''),
        NULLIF(btrim(e.props ->> 'reason'), ''),
        '(no message)'
      ) AS message,
      COALESCE(
        NULLIF(btrim(e.props ->> 'build'), ''),
        NULLIF(btrim(e.props ->> 'version'), ''),
        '(unknown build)'
      ) AS build,
      e.user_id, e.created_at
    FROM public.analytics_events e
    WHERE e.name = 'app_error'
      AND e.created_at >= v_cur_from
  ),
  grouped AS (
    SELECT message, build,
           COUNT(*)                   AS cnt,
           COUNT(DISTINCT user_id)     AS users,
           MIN(created_at)             AS first_seen_at,
           MAX(created_at)             AS last_seen_at
    FROM src
    GROUP BY message, build
  )
  SELECT jsonb_build_object
  (
    'window_days', v_days,
    'window_from', v_cur_from,
    'total_errors', COALESCE((SELECT SUM(cnt) FROM grouped), 0),
    'distinct_groups', (SELECT COUNT(*) FROM grouped),
    'members_affected', (SELECT COUNT(DISTINCT user_id) FROM src WHERE user_id IS NOT NULL),
    'rows', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'message', g.message,
        'build', g.build,
        'count', g.cnt,
        'users', g.users,
        'first_seen_at', g.first_seen_at,
        'last_seen_at', g.last_seen_at
      ))
      FROM (
        SELECT * FROM grouped ORDER BY last_seen_at DESC, cnt DESC LIMIT v_limit OFFSET v_offset
      ) g
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_admin_app_errors(integer, integer, integer) IS
  'app_error grouped by message + build. Four uncaught crashes went unnoticed for five days; this is what the screen is for.';

REVOKE ALL ON FUNCTION public.get_admin_event_aggregates(integer, text, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_event_daily(text, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_event_occurrences(text, integer, timestamptz, uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_app_errors(integer, integer, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_admin_event_aggregates(integer, text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_event_daily(text, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_event_occurrences(text, integer, timestamptz, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_app_errors(integer, integer, integer) TO authenticated, service_role;