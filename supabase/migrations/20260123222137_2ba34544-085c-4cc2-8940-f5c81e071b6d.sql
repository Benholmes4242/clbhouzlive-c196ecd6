-- First, delete the old quarterly seasons (2-8) and add themed ones
DELETE FROM championship_seasons WHERE season_number > 1;

-- Update Season 1 to be Pre-Season Training
UPDATE championship_seasons
SET name = 'Pre-Season Training'
WHERE season_number = 1;

-- Add display metadata columns
ALTER TABLE championship_seasons
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS color TEXT;

-- Insert themed seasons for 2026 and 2027
INSERT INTO championship_seasons (season_number, name, status, start_date, end_date, tagline, description, icon, color)
VALUES
  -- 2026
  (2, 'Major Season', 'upcoming', '2026-04-01', '2026-07-31', 
   'The main event', 'Peak competition season. Chase the leaderboard when it matters most.', '🏆', '#F59E0B'),
  (3, 'Summer Season', 'upcoming', '2026-08-01', '2026-10-31',
   'Make every round count', 'Long days, perfect conditions. The season for bucket-list courses.', '☀️', '#3B82F6'),
  (4, 'Off-Season', 'upcoming', '2026-11-01', '2026-12-31',
   'Wind down & reflect', 'Close out the year strong. Every course logged still counts.', '🍂', '#8B5CF6'),
  -- 2027
  (5, 'Pre-Season Training', 'upcoming', '2027-01-01', '2027-03-31',
   'Get match ready', 'Shake off the rust and build your course count before the majors begin.', '🏋️', '#10B981'),
  (6, 'Major Season', 'upcoming', '2027-04-01', '2027-07-31',
   'The main event', 'Peak competition season. Chase the leaderboard when it matters most.', '🏆', '#F59E0B'),
  (7, 'Summer Season', 'upcoming', '2027-08-01', '2027-10-31',
   'Make every round count', 'Long days, perfect conditions. The season for bucket-list courses.', '☀️', '#3B82F6'),
  (8, 'Off-Season', 'upcoming', '2027-11-01', '2027-12-31',
   'Wind down & reflect', 'Close out the year strong. Every course logged still counts.', '🍂', '#8B5CF6');

-- Update Season 1 with its themed metadata
UPDATE championship_seasons SET
  tagline = 'Get match ready',
  description = 'Shake off the rust and build your course count before the majors begin.',
  icon = '🏋️',
  color = '#10B981'
WHERE season_number = 1;

-- Create RPC to get season calendar for UI
CREATE OR REPLACE FUNCTION get_season_calendar()
RETURNS TABLE (
  season_id UUID,
  season_number INTEGER,
  name TEXT,
  tagline TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  status TEXT,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  is_current BOOLEAN,
  days_remaining INTEGER,
  days_until_start INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id as season_id,
    cs.season_number,
    cs.name::TEXT,
    cs.tagline::TEXT,
    cs.description::TEXT,
    cs.icon::TEXT,
    cs.color::TEXT,
    cs.status::TEXT,
    cs.start_date,
    cs.end_date,
    (cs.end_date - cs.start_date)::INTEGER as duration_days,
    (cs.status = 'active')::BOOLEAN as is_current,
    CASE 
      WHEN cs.status = 'active' THEN (cs.end_date - CURRENT_DATE)::INTEGER
      ELSE NULL
    END as days_remaining,
    CASE 
      WHEN cs.status = 'upcoming' THEN (cs.start_date - CURRENT_DATE)::INTEGER
      ELSE NULL
    END as days_until_start
  FROM championship_seasons cs
  WHERE cs.start_date >= DATE_TRUNC('year', CURRENT_DATE)
  ORDER BY cs.start_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_season_calendar TO authenticated, anon;