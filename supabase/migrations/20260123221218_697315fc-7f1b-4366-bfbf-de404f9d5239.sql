-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Insert all 2026-2027 seasons (Season 1 already exists)
INSERT INTO championship_seasons (season_number, name, status, start_date, end_date)
VALUES
  (2, 'Season 2', 'upcoming', '2026-04-01', '2026-06-30'),
  (3, 'Season 3', 'upcoming', '2026-07-01', '2026-09-30'),
  (4, 'Season 4', 'upcoming', '2026-10-01', '2026-12-31'),
  (5, 'Season 5', 'upcoming', '2027-01-01', '2027-03-31'),
  (6, 'Season 6', 'upcoming', '2027-04-01', '2027-06-30'),
  (7, 'Season 7', 'upcoming', '2027-07-01', '2027-09-30'),
  (8, 'Season 8', 'upcoming', '2027-10-01', '2027-12-31')
ON CONFLICT DO NOTHING;

-- Schedule daily rotation check at midnight UTC
SELECT cron.schedule(
  'rotate-championship-seasons',
  '0 0 * * *',
  $$SELECT rotate_championship_seasons()$$
);