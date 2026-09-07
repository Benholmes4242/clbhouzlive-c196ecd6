-- The previous revision built 'anon_sessions' with a malformed expression
-- (referenced a column that does not exist on a dummy lateral). plpgsql does
-- not resolve columns at CREATE time, so it would have failed only when an
-- admin first opened the screen. Replaced with a plain subquery.
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
  v_min_cnt integer := GREATEST(COALESCE(p_stopped_min_count, 25), 0);
  v_min_usr integer := GREATEST(COALESCE(p_stopped_min_users, 2), 0);
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
    SELECT e.name, e.created_at, e.user_id, e.props,
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
  -- ALARM basis: always NON-STAFF, whatever the toggle says. If one of the two
  -- prior members was staff, one holiday would alarm a healthy event; and an
  -- event only staff ever fired is not an event the platform uses.
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
      (a.prior_cnt > 0 AND a.cnt = 0) AS silent,
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
      stopped DESC,
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
    'staff_events',   (SELECT COUNT(*) FROM scoped s WHERE s.created_at >= v_cur_from AND s.is_staff),
    -- Logged-out browsing. Real traffic, not loss: bots are blocked at write
    -- time, so a null user_id is a visitor with no session.
    'anon_events',    (SELECT COUNT(*) FROM scoped s WHERE s.created_at >= v_cur_from AND s.user_id IS NULL),
    'anon_sessions',  (SELECT COUNT(DISTINCT s.props->>'session_id') FROM scoped s
                        WHERE s.created_at >= v_cur_from AND s.user_id IS NULL),
    'window_members', (SELECT COUNT(DISTINCT c.user_id) FROM counted c WHERE c.created_at >= v_cur_from),
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