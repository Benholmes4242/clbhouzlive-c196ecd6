-- Add Torrey Pines venue mapping to sr_course_map
-- Using South Course as primary (the famous tournament course)
INSERT INTO sr_course_map (sr_venue_name, golf_course_id)
VALUES ('Torrey Pines', 'cd5e0269-e1ba-4d02-867e-dfecf0ead114')
ON CONFLICT (sr_venue_name) DO NOTHING;