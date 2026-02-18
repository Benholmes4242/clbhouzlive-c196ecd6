-- PGA Tour 2026 — daily at 6:35 AM UTC
SELECT cron.schedule(
  'sync-player-stats-pga-2026',
  '35 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/sportradar-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{"action": "player_stats", "tourId": "pga", "year": 2026}'::jsonb
  ) AS request_id;
  $$
);

-- LIV Golf 2026 — daily at 6:40 AM UTC
SELECT cron.schedule(
  'sync-player-stats-liv-2026',
  '40 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/sportradar-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{"action": "player_stats", "tourId": "liv", "year": 2026}'::jsonb
  ) AS request_id;
  $$
);

-- LPGA Tour 2026 — daily at 6:45 AM UTC
SELECT cron.schedule(
  'sync-player-stats-lpga-2026',
  '45 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/sportradar-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{"action": "player_stats", "tourId": "lpga", "year": 2026}'::jsonb
  ) AS request_id;
  $$
);

-- Champions Tour 2026 — daily at 6:50 AM UTC
SELECT cron.schedule(
  'sync-player-stats-champ-2026',
  '50 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/sportradar-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{"action": "player_stats", "tourId": "champ", "year": 2026}'::jsonb
  ) AS request_id;
  $$
);

-- DP World Tour 2026 — daily at 6:55 AM UTC
SELECT cron.schedule(
  'sync-player-stats-euro-2026',
  '55 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/sportradar-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{"action": "player_stats", "tourId": "euro", "year": 2026}'::jsonb
  ) AS request_id;
  $$
);