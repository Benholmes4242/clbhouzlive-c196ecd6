DROP FUNCTION IF EXISTS public.get_eg_sync_health();

CREATE OR REPLACE FUNCTION public.get_eg_sync_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_status_ok int;
  v_auth_failed int;
  v_eg_unavailable int;
  v_consecutive_failures int;
  v_last_attempt timestamptz;
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
  WHERE provider = 'england_golf';

  SELECT COUNT(*) INTO v_status_ok
  FROM whs_connections
  WHERE provider = 'england_golf' AND last_sync_status = 'ok';

  SELECT COUNT(*) INTO v_auth_failed
  FROM whs_connections
  WHERE provider = 'england_golf' AND last_sync_status = 'auth_failed';

  SELECT COUNT(*) INTO v_eg_unavailable
  FROM whs_connections
  WHERE provider = 'england_golf' AND last_sync_status = 'eg_unavailable';

  SELECT COALESCE(SUM(consecutive_failures), 0) INTO v_consecutive_failures
  FROM whs_connections
  WHERE provider = 'england_golf';

  SELECT MAX(last_synced_at) INTO v_last_attempt
  FROM whs_connections
  WHERE provider = 'england_golf';

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
  ELSIF v_cron_last_run IS NULL THEN
    v_status := 'red';
  ELSIF v_cron_hours_ago > 14 THEN
    v_status := 'red';
  ELSIF v_cron_last_status = 'failed' THEN
    v_status := 'red';
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
    'last_attempt_at', v_last_attempt,
    'cron_last_run_at', v_cron_last_run,
    'cron_last_status', v_cron_last_status,
    'cron_hours_ago', v_cron_hours_ago,
    'computed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_eg_sync_health() TO authenticated;