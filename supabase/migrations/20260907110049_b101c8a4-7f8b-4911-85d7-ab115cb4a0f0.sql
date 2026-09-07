CREATE OR REPLACE FUNCTION public.get_admin_event_aggregates(
  p_days integer DEFAULT 30,
  p_search text DEFAULT NULL::text,
  p_sort text DEFAULT 'count'::text,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_stopped_min_count integer DEFAULT 25,
  p_stopped_min_users integer DEFAULT 2
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
  -- Volume floor on the alarm. "Fired last period, silent this one" is far too
  -- weak on a 99-member platform: 37 of 207 names qualified, and a banner that
  -- is right a third of the time is ignored inside a fortnight. An alarm now
  -- also requires the prior period to have been busy enough, across enough
  -- distinct members, for silence to mean something. Rare-by-nature events
  -- (hole in one, level up, business verification) stay SILENT, not ALARMING.
  v_min_cnt integer := GREATEST(COALESCE(p_stopped_min_count, 25), 0);
  v_min_usr integer := GREATEST(COALESCE(p_stopped_min_users, 2), 0);
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
      -- SILENT: fired in the prior window, nothing in this one. Reported, not alarmed.
      (prior_cnt > 0 AND cnt = 0) AS silent,
      -- STOPPED: silent AND the prior period carried real weight. This is the
      -- only state the banner counts.
      (prior_cnt >= v_min_cnt AND prior_users >= v_min_usr AND cnt = 0) AS stopped,
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
    'stopped_min_count', v_min_cnt,
    'stopped_min_users', v_min_usr,
    'distinct_names', t.distinct_names,
    'stopped_names',  t.stopped_names,
    'silent_names',   t.silent_names,
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
        'silent',          o.silent,
        -- All-time first sighting, used by the rename heuristic on the client:
        -- an event first seen inside the current window that appeared as another
        -- went silent is probably a rename, not a break. Cheap: one index-only
        -- MIN per returned name on (name, created_at).
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

REVOKE ALL ON FUNCTION public.get_admin_event_aggregates(integer, text, text, integer, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_event_aggregates(integer, text, text, integer, integer, integer, integer) TO authenticated, service_role;