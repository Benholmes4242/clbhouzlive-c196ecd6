CREATE OR REPLACE FUNCTION public.get_admin_audiences()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- A permission failure is an ERROR, never a NULL payload. NULL is
  -- indistinguishable from "no data" at the client: it renders zeros or throws
  -- on a property access with no useful message. Fail loudly.
  IF NOT public.can_moderate() THEN
    RAISE EXCEPTION 'get_admin_audiences: permission denied'
      USING ERRCODE = '42501';
  END IF;

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
  SELECT to_jsonb(agg) INTO result FROM agg;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_audiences() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_audiences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_audiences() TO service_role;