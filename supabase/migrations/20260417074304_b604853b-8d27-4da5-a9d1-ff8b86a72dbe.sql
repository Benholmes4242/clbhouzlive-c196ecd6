-- Ensure scheduling extensions are available
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop any prior schedule with the same name so this is idempotent
DO $$
BEGIN
  PERFORM cron.unschedule('top100-daily-editorial')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'top100-daily-editorial'
  );
EXCEPTION WHEN OTHERS THEN
  -- ignore if cron schema unavailable
  NULL;
END $$;

-- Schedule daily editorial generation at 06:00 UTC
SELECT cron.schedule(
  'top100-daily-editorial',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/daily-editorial-generation',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);