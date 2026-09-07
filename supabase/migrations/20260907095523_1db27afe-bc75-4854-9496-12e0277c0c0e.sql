-- 1) Flag the service account. It is confirmed and inside the profile table,
--    but it is NOT a member and must not appear in any member metric.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_system_account boolean NOT NULL DEFAULT false;

UPDATE public.user_profiles
   SET is_system_account = true
 WHERE id = 'b8437384-291a-4d85-b81f-24c1068235dd';

-- 2) Audiences, computed server-side in ONE row.
--    Replaces sixteen-hook-style raw analytics_events selects in the browser:
--    PostgREST caps a response at 2000 rows regardless of the requested limit,
--    and without ORDER BY that slice is the OLDEST physical rows, so recent
--    activity was invisible and members fell into "dormant".
CREATE OR REPLACE FUNCTION public.get_admin_audiences()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
WITH members AS (
  -- THE population. Every figure below is a subset of this set.
  SELECT p.id, p.created_at, p.is_suspended
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
    -- Funnel figure, NOT an audience: these accounts are not members.
    (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NULL)         AS incomplete_signups,
    -- Windows, joined to members so orphaned event user_ids cannot inflate them.
    (SELECT count(*) FROM ev WHERE last_seen >= CURRENT_DATE - 6)              AS wau,
    (SELECT count(*) FROM ev WHERE last_seen >= CURRENT_DATE - 29)             AS mau,
    (SELECT count(DISTINCT e.user_id) FROM public.analytics_events e
       JOIN members m ON m.id = e.user_id
      WHERE e.created_at >= CURRENT_DATE)                                      AS dau_today
)
SELECT CASE WHEN NOT public.can_moderate() THEN NULL ELSE to_jsonb(agg) END FROM agg;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_audiences() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_audiences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_audiences() TO service_role;

-- 3) get_platform_activity: same signature, same column order. WAU / MAU / DAU
--    now join the member table, so events left behind by a deleted account are
--    kept as history but no longer counted as an active member.
CREATE OR REPLACE FUNCTION public.get_platform_activity(p_days integer DEFAULT 30)
 RETURNS TABLE(dau_today integer, avg_dau integer, peak_dau integer, wau integer, mau integer, trend jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH members AS (
    SELECT p.id FROM public.user_profiles p
    WHERE p.deleted_at IS NULL AND COALESCE(p.is_system_account, false) = false
  ),
  bounds AS (
    SELECT (CURRENT_DATE - (GREATEST(p_days, 1) - 1))::date AS from_day,
           CURRENT_DATE                                     AS to_day
  ),
  days AS (
    SELECT d::date AS day
    FROM bounds b, generate_series(b.from_day, b.to_day, interval '1 day') d
  ),
  per_day AS (
    SELECT d.day, COUNT(DISTINCT e.user_id)::int AS dau
    FROM days d
    LEFT JOIN public.analytics_events e
      ON e.created_at >= d.day
     AND e.created_at <  d.day + 1
     AND e.user_id IS NOT NULL
     AND e.user_id IN (SELECT id FROM members)
    GROUP BY d.day
  ),
  first_event AS (
    SELECT MIN(created_at)::date AS day FROM public.analytics_events
    WHERE user_id IS NOT NULL
  )
  SELECT
    (SELECT dau FROM per_day WHERE day = CURRENT_DATE),
    COALESCE((SELECT ROUND(AVG(p.dau))::int FROM per_day p, first_event f
               WHERE p.day >= COALESCE(f.day, p.day)), 0),
    COALESCE((SELECT MAX(dau) FROM per_day), 0),
    (SELECT COUNT(DISTINCT user_id)::int FROM public.analytics_events
      WHERE created_at >= CURRENT_DATE - 6 AND user_id IN (SELECT id FROM members)),
    (SELECT COUNT(DISTINCT user_id)::int FROM public.analytics_events
      WHERE created_at >= CURRENT_DATE - 29 AND user_id IN (SELECT id FROM members)),
    (SELECT jsonb_agg(jsonb_build_object('date', to_char(day, 'YYYY-MM-DD'), 'value', dau)
                      ORDER BY day) FROM per_day);
$function$;