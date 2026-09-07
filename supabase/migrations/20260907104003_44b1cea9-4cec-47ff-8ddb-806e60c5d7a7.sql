-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN RAW-READ REMEDIATION (batch 2)
-- Dashboard glance and North Star were running at ~70% of the 2000-row
-- PostgREST cap on a single day's events. Pre-emptive: counting moves into
-- Postgres before the first busy day breaks them.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_glance(p_tz text DEFAULT 'UTC')
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

CREATE OR REPLACE FUNCTION public.get_admin_north_star()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
  MIN_COHORT constant integer := 3;
BEGIN
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_north_star: permission denied'
      USING ERRCODE = '42501';
  END IF;

  WITH members AS (
    SELECT p.id, p.created_at
    FROM public.user_profiles p
    WHERE p.deleted_at IS NULL
      AND COALESCE(p.is_system_account, false) = false
  ),
  active_24h AS (
    SELECT DISTINCT e.user_id
    FROM public.analytics_events e
    JOIN members m ON m.id = e.user_id
    WHERE e.created_at >= now() - interval '24 hours'
  ),
  d1_cohort AS (
    SELECT id FROM members
    WHERE created_at >= now() - interval '2 days'
      AND created_at <  now() - interval '1 day'
  ),
  d7_cohort AS (
    SELECT id FROM members
    WHERE created_at >= now() - interval '8 days'
      AND created_at <  now() - interval '7 days'
  ),
  agg AS (
    SELECT
      (SELECT count(DISTINCT e.user_id)::int FROM public.analytics_events e
         JOIN members m ON m.id = e.user_id
        WHERE e.created_at >= CURRENT_DATE)                                  AS dau_today,
      (SELECT count(DISTINCT e.user_id)::int FROM public.analytics_events e
         JOIN members m ON m.id = e.user_id
        WHERE e.created_at >= CURRENT_DATE - 1
          AND e.created_at <  CURRENT_DATE)                                  AS dau_yesterday,
      (SELECT count(DISTINCT e.user_id)::int FROM public.analytics_events e
         JOIN members m ON m.id = e.user_id
        WHERE e.created_at >= CURRENT_DATE - 6)                              AS wau,
      -- Prior 7-day window: a union of unique members, computed here because
      -- it cannot be derived from a per-day trend. This is what useNorthStar
      -- previously had to report as unavailable.
      (SELECT count(DISTINCT e.user_id)::int FROM public.analytics_events e
         JOIN members m ON m.id = e.user_id
        WHERE e.created_at >= CURRENT_DATE - 13
          AND e.created_at <  CURRENT_DATE - 6)                              AS wau_prev,
      (SELECT count(DISTINCT e.user_id)::int FROM public.analytics_events e
         JOIN members m ON m.id = e.user_id
        WHERE e.created_at >= CURRENT_DATE - 29)                             AS mau,
      (SELECT count(*)::int FROM members
        WHERE created_at >= now() - interval '7 days')                       AS signups_7d,
      (SELECT count(*)::int FROM members
        WHERE created_at >= now() - interval '14 days'
          AND created_at <  now() - interval '7 days')                       AS signups_prev_7d,
      (SELECT count(*)::int FROM members)                                    AS total_users,
      (SELECT count(*)::int FROM d1_cohort)                                  AS d1_cohort_size,
      (SELECT count(*)::int FROM d1_cohort c
        WHERE EXISTS (SELECT 1 FROM active_24h a WHERE a.user_id = c.id))    AS d1_returned,
      (SELECT count(*)::int FROM d7_cohort)                                  AS d7_cohort_size,
      (SELECT count(*)::int FROM d7_cohort c
        WHERE EXISTS (SELECT 1 FROM active_24h a WHERE a.user_id = c.id))    AS d7_returned
  )
  SELECT jsonb_build_object(
    'dau_today', dau_today,
    'dau_yesterday', dau_yesterday,
    'wau', wau,
    'wau_prev', wau_prev,
    'mau', mau,
    'signups_7d', signups_7d,
    'signups_prev_7d', signups_prev_7d,
    'total_users', total_users,
    'd1_cohort_size', d1_cohort_size,
    'd7_cohort_size', d7_cohort_size,
    -- NULL below the minimum cohort size: a percentage of one or two accounts
    -- is noise wearing a number's clothes.
    'd1_retention', CASE WHEN d1_cohort_size >= MIN_COHORT
                         THEN round((d1_returned::numeric / d1_cohort_size) * 100)::int END,
    'd7_retention', CASE WHEN d7_cohort_size >= MIN_COHORT
                         THEN round((d7_returned::numeric / d7_cohort_size) * 100)::int END
  ) INTO result
  FROM agg;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_glance(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_north_star() TO authenticated;