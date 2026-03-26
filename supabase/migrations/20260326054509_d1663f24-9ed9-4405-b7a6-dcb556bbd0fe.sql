INSERT INTO sr_course_map (sr_venue_name, golf_course_id)
VALUES ('DLF Golf & Country Club', '2dbf0917-4126-4bfe-b63c-62aa838bcdbb')
ON CONFLICT (sr_venue_name) DO NOTHING;