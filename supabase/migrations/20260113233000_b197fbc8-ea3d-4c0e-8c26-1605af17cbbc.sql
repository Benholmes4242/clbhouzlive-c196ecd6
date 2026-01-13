-- Create views that map games to event structure for unified Hub experience

-- Games as Events view
CREATE OR REPLACE VIEW games_as_events AS
SELECT 
  g.id,
  g.id as legacy_game_id,
  NULL::uuid as legacy_trip_id,
  'single_round' as event_type,
  g.course_name as name,
  g.note as description,
  g.host_user_id as creator_id,
  g.start_time::date as start_date,
  g.start_time::date as end_date,
  'none'::text as scoring_format,
  g.slots_total as max_participants,
  g.visibility,
  g.status,
  NULL::text as share_code,
  g.created_at,
  g.updated_at,
  g.start_time,
  g.course_id,
  NULL::int as holes,
  g.lat,
  g.lng
FROM games g
WHERE g.status != 'cancelled';

-- Trips as Events view
CREATE OR REPLACE VIEW trips_as_events AS
SELECT 
  t.id,
  NULL::uuid as legacy_game_id,
  t.id as legacy_trip_id,
  'multi_day' as event_type,
  t.name,
  t.description,
  t.created_by as creator_id,
  t.start_date,
  t.end_date,
  'none'::text as scoring_format,
  NULL::int as max_participants,
  t.visibility,
  t.status,
  NULL::text as share_code,
  t.created_at,
  t.updated_at,
  NULL::timestamptz as start_time,
  NULL::uuid as course_id,
  NULL::int as holes,
  NULL::float8 as lat,
  NULL::float8 as lng
FROM trips t
WHERE t.status != 'cancelled';

-- Combined Hub Events view (games + trips unified)
CREATE OR REPLACE VIEW hub_events AS
SELECT * FROM games_as_events
UNION ALL
SELECT * FROM trips_as_events;

-- Unified Participants view
CREATE OR REPLACE VIEW hub_participants AS
-- Game participants
SELECT 
  gp.id,
  gp.game_id as event_id,
  'game' as source_type,
  gp.user_id,
  gp.guest_name,
  gp.rsvp_status as status,
  CASE gp.rsvp_status
    WHEN 'going' THEN 'confirmed'
    WHEN 'requested' THEN 'pending'
    WHEN 'invited' THEN 'invited'
    WHEN 'rejected' THEN 'declined'
    ELSE 'pending'
  END as normalized_status,
  NULL::numeric as handicap_index,
  (gp.role = 'host') as is_organizer,
  gp.created_at
FROM game_participants gp
UNION ALL
-- Trip participants
SELECT 
  tp.id,
  tp.trip_id as event_id,
  'trip' as source_type,
  tp.user_id,
  NULL::text as guest_name,
  tp.rsvp_status as status,
  CASE tp.rsvp_status
    WHEN 'confirmed' THEN 'confirmed'
    WHEN 'going' THEN 'confirmed'
    WHEN 'pending' THEN 'pending'
    WHEN 'invited' THEN 'invited'
    ELSE 'pending'
  END as normalized_status,
  NULL::numeric as handicap_index,
  (tp.role = 'organizer') as is_organizer,
  tp.created_at
FROM trip_participants tp;