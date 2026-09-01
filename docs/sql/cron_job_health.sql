-- ─────────────────────────────────────────────────────────────────────────────
-- BRIEF_CRON_FAILURE_WATCH — cron job health read surface.
-- Run by hand in the SQL editor. No migration, no new cron job.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.cron_job_health AS
WITH latest AS (
  SELECT DISTINCT ON (d.jobid)
         d.jobid, d.status, d.start_time, d.end_time, d.return_message
  FROM cron.job_run_details d
  ORDER BY d.jobid, d.start_time DESC
),
windowed AS (
  SELECT d.jobid,
         count(*) FILTER (WHERE d.status = 'failed')    AS failed_24h,
         count(*) FILTER (WHERE d.status = 'succeeded') AS ok_24h
  FROM cron.job_run_details d
  WHERE d.start_time > now() - interval '24 hours'
  GROUP BY d.jobid
)
SELECT j.jobid,
       j.jobname,
       j.schedule,
       j.active,
       l.status                       AS last_status,
       l.start_time                   AS last_run_at,
       left(coalesce(l.return_message, ''), 500) AS last_message,
       coalesce(w.failed_24h, 0)      AS failed_24h,
       coalesce(w.ok_24h, 0)          AS ok_24h,
       (SELECT max(d2.start_time)
          FROM cron.job_run_details d2
         WHERE d2.jobid = j.jobid AND d2.status = 'succeeded') AS last_success_at
FROM cron.job j
LEFT JOIN latest   l ON l.jobid = j.jobid
LEFT JOIN windowed w ON w.jobid = j.jobid
WHERE j.active;

COMMENT ON VIEW public.cron_job_health IS
  'Per-job cron state for the admin Health page. A row with last_status = failed needs looking at; last_success_at IS NULL means the job has never once worked.';

ALTER VIEW public.cron_job_health SET (security_invoker = true);

REVOKE ALL ON public.cron_job_health FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_cron_job_health()
RETURNS SETOF public.cron_job_health
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.cron_job_health
  WHERE public.is_panel_admin()
  ORDER BY (last_status = 'failed') DESC,
           (last_success_at IS NULL) DESC,
           failed_24h DESC,
           jobname;
$$;

REVOKE EXECUTE ON FUNCTION public.get_cron_job_health() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_cron_job_health() TO authenticated;

-- Verify:
-- select count(*) from cron.job where active;      -- 73 today
-- select * from public.get_cron_job_health();
