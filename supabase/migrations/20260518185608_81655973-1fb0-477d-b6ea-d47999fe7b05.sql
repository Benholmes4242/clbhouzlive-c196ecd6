
-- 1. Unschedule the legacy nightly bridge job.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'whs-course-bridge-nightly';

-- 2. Schedule the new 6-hourly orchestrator.
SELECT cron.schedule(
  'gam-course-mapping-orchestrator-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/gam-course-mapping-orchestrator',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);
