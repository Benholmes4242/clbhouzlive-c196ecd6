-- Backfill course_image_url for Arnold Palmer Invitational
UPDATE tournament_result_meta
SET course_image_url = (
  SELECT thumbnail_image 
  FROM golf_courses 
  WHERE name ILIKE '%Bay Hill%'
  AND thumbnail_image IS NOT NULL
  LIMIT 1
)
WHERE tournament_name ILIKE '%Arnold Palmer%'
AND course_image_url IS NULL;