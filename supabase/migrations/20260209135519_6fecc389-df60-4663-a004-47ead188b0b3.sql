-- Backfill existing friend_course_review notifications with course_name and rating
UPDATE notifications n
SET data = n.data || jsonb_build_object(
  'course_name', gc.name,
  'rating', cr.rating
)
FROM course_ratings cr
JOIN golf_courses gc ON gc.id = cr.course_id
WHERE n.type = 'friend_course_review'
  AND cr.id = n.entity_id::uuid
  AND (n.data IS NULL OR n.data->>'course_name' IS NULL);