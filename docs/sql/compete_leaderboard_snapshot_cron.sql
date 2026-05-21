-- ── snapshot-friend-leaderboard nightly schedule ───────────────────────────
-- Runs at 01:15 UTC daily. Before the 06:35-06:55 UTC Sportradar syncs and
-- before the Sunday 03:00 UTC weekly-handicap-snapshot job. Late enough that
-- today's last_round_played_at is stable. Adjust here if the existing
-- handicap snapshot timing shifts.

select cron.schedule(
  'snapshot-friend-leaderboard-daily',
  '15 1 * * *',
  $$
  select net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/snapshot-friend-leaderboard',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
