-- Add mapping for Riyadh Golf Club to sr_course_map
INSERT INTO sr_course_map (sr_venue_name, sr_venue_course_name, sr_city, sr_country, golf_course_id, confidence, source)
VALUES (
  'Riyadh Golf Club',
  'Riyadh Golf Club',
  'Riyadh',
  'Saudi Arabia',
  'bafde114-985c-4609-a22b-591d18c79e1b',
  1.00,
  'manual'
)
ON CONFLICT (sr_venue_name) DO UPDATE SET
  golf_course_id = EXCLUDED.golf_course_id,
  updated_at = now();