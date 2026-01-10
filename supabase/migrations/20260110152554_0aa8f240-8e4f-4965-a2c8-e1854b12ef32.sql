-- Create discover_games_anon view for server-side search
-- Supports search across course_name OR host home_club
-- Returns anonymous host blurb (no identifying info)

CREATE OR REPLACE VIEW public.discover_games_anon AS
SELECT 
  g.id,
  g.host_user_id,
  g.course_name,
  g.course_id,
  g.start_time,
  g.ends_at,
  g.expires_at,
  g.status,
  g.visibility,
  g.slots_total,
  g.slots_open,
  -- Anonymous host blurb
  pgb.handicap AS host_handicap,
  pgb.home_club AS host_home_club,
  -- Searchable fields combined for ILIKE
  COALESCE(g.course_name, '') || ' ' || COALESCE(pgb.home_club, '') AS search_text
FROM games g
LEFT JOIN public_golfer_blurbs pgb ON pgb.user_id = g.host_user_id
WHERE g.status IN ('active', 'scheduled')
  AND g.expires_at >= now();

-- Create discover_trips_anon view for server-side search
CREATE OR REPLACE VIEW public.discover_trips_anon AS
SELECT 
  t.id,
  t.created_by AS organizer_id,
  t.name AS title,
  t.description,
  t.start_date,
  t.end_date,
  t.status,
  t.visibility,
  -- Anonymous organizer blurb
  pgb.handicap AS organizer_handicap,
  pgb.home_club AS organizer_home_club,
  -- Searchable fields combined for ILIKE
  COALESCE(t.name, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(pgb.home_club, '') AS search_text
FROM trips t
LEFT JOIN public_golfer_blurbs pgb ON pgb.user_id = t.created_by
WHERE t.status IN ('active', 'scheduled', 'open')
  AND t.start_date >= CURRENT_DATE;