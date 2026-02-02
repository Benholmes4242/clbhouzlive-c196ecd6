-- Fix Pebble Beach mapping to point to correct course
UPDATE sr_course_map 
SET golf_course_id = 'a2426246-5314-42f7-8637-de23bd8d7665',
    updated_at = now()
WHERE sr_venue_name = 'Pebble Beach Golf Links';