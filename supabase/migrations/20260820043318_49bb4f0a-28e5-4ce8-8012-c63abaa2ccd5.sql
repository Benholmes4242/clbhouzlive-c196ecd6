-- 1. Claim column: written BEFORE an attempt, so a hung row can never lead the queue forever.
ALTER TABLE public.whs_connections
  ADD COLUMN IF NOT EXISTS last_attempted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_whs_connections_last_attempted
  ON public.whs_connections (last_attempted_at NULLS FIRST)
  WHERE deleted_at IS NULL;

-- 2. Health: red when the freshest connection in the estate is older than 12h.
CREATE OR REPLACE FUNCTION public.get_eg_sync_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total int;
  v_status_ok int;
  v_auth_failed int;
  v_eg_unavailable int;
  v_consecutive_failures int;
  v_last_attempt timestamptz;
  v_freshest timestamptz;
  v_freshest_hours numeric;
  v_stale_12h int;
  v_poisoned int;
  v_cron_last_run timestamptz;
  v_cron_last_status text;
  v_cron_hours_ago numeric;
  v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM whs_connections
  WHERE provider = 'england_golf' AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_status_ok
  FROM whs_connections
  WHERE provider = 'england_golf' AND deleted_at IS NULL AND last_sync_status = 'ok';

  SELECT COUNT(*) INTO v_auth_failed
  FROM whs_connections
  WHERE provider = 'england_golf' AND deleted_at IS NULL AND last_sync_status = 'auth_failed';

  SELECT COUNT(*) INTO v_eg_unavailable
  FROM whs_connections
  WHERE provider = 'england_golf' AND deleted_at IS NULL AND last_sync_status = 'eg_unavailable';

  SELECT COALESCE(SUM(consecutive_failures), 0) INTO v_consecutive_failures
  FROM whs_connections
  WHERE provider = 'england_golf' AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_poisoned
  FROM whs_connections
  WHERE provider = 'england_golf' AND deleted_at IS NULL AND consecutive_failures >= 5;

  -- Freshness across ALL non-deleted connections, any provider: one member
  -- syncing by hand must not mask an estate-wide outage, so we also count how
  -- many rows are themselves stale.
  SELECT MAX(last_synced_at) INTO v_freshest
  FROM whs_connections
  WHERE deleted_at IS NULL;

  SELECT COUNT(*) INTO v_stale_12h
  FROM whs_connections
  WHERE deleted_at IS NULL
    AND (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL '12 hours');

  v_last_attempt := v_freshest;
  v_freshest_hours := CASE
    WHEN v_freshest IS NULL THEN NULL
    ELSE EXTRACT(EPOCH FROM (NOW() - v_freshest)) / 3600.0
  END;

  SELECT start_time, status INTO v_cron_last_run, v_cron_last_status
  FROM cron.job_run_details
  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-whs-due-every-6h' LIMIT 1)
  ORDER BY start_time DESC
  LIMIT 1;

  v_cron_hours_ago := CASE
    WHEN v_cron_last_run IS NULL THEN NULL
    ELSE EXTRACT(EPOCH FROM (NOW() - v_cron_last_run)) / 3600.0
  END;

  IF v_total = 0 THEN
    v_status := 'idle';
  ELSIF v_freshest IS NULL OR v_freshest_hours > 12 THEN
    v_status := 'red';
  ELSIF v_cron_last_run IS NULL THEN
    v_status := 'red';
  ELSIF v_cron_hours_ago > 14 THEN
    v_status := 'red';
  ELSIF v_cron_last_status = 'failed' THEN
    v_status := 'red';
  ELSIF v_stale_12h > 0 THEN
    v_status := 'amber';
  ELSIF v_cron_hours_ago > 8 THEN
    v_status := 'amber';
  ELSIF v_status_ok = 0 THEN
    v_status := 'amber';
  ELSE
    v_status := 'green';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'total_connected', v_total,
    'status_ok_count', v_status_ok,
    'auth_failed', v_auth_failed,
    'eg_unavailable', v_eg_unavailable,
    'consecutive_failures_total', v_consecutive_failures,
    'poisoned_count', v_poisoned,
    'freshest_sync_at', v_freshest,
    'freshest_hours_ago', v_freshest_hours,
    'stale_12h_count', v_stale_12h,
    'last_attempt_at', v_last_attempt,
    'cron_last_run_at', v_cron_last_run,
    'cron_last_status', v_cron_last_status,
    'cron_hours_ago', v_cron_hours_ago,
    'computed_at', NOW()
  );
END;
$function$;