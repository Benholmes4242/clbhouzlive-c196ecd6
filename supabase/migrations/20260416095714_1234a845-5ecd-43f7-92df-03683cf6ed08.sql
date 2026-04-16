SELECT cron.schedule(
  'sync-player-stats-pgad-2026',
  '30 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/sportradar-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{"action": "player_stats", "tourId": "pgad", "year": 2026}'::jsonb
  ) AS request_id;
  $$
);