-- Add unique constraint on sr_venue_name for proper ON CONFLICT handling
ALTER TABLE sr_course_map 
ADD CONSTRAINT sr_course_map_sr_venue_name_key UNIQUE (sr_venue_name);