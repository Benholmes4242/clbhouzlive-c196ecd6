-- Update tournament-live-sync cron from every 2 minutes to every 1 minute
-- This reduces refresh cycle from ~6-8 minutes to ~3-4 minutes per tournament
SELECT cron.unschedule('live-tournament-sync');

SELECT cron.schedule(
  'live-tournament-sync',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/tournament-live-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NTkxODgsImV4cCI6MjA1MjAzNTE4OH0.FY-2G0bsmIi_CjkdCQaO8E8sFDhLuv5bPMSvVB4rCFs"}'::jsonb
  )
  $$
);