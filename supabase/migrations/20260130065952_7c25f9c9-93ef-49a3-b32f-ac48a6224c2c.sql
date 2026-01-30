-- Insert course mapping for Lake Nona Golf & Country Club -> Lake Nona Golf Club, Inc
INSERT INTO sr_course_map (sr_venue_name, sr_venue_course_name, sr_city, sr_country, golf_course_id, confidence, source)
VALUES (
  'Lake Nona Golf & Country Club',
  'Lake Nona Golf & Country Club',
  'Orlando',
  'USA',
  '46f9e332-5884-4874-a23f-dc851403d480',
  1.0,
  'manual'
)
ON CONFLICT DO NOTHING;