
-- Fix get_user_top100_course_ids to use course_top100_memberships join instead of non-existent is_top100 column
CREATE OR REPLACE FUNCTION public.get_user_top100_course_ids(target_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
AS $function$
  SELECT coalesce(array_agg(DISTINCT cr.course_id), array[]::uuid[])
  FROM course_ratings cr
  WHERE cr.user_id = target_user_id
    AND EXISTS (
      SELECT 1 FROM course_top100_memberships ctm 
      WHERE ctm.course_id = cr.course_id
    );
$function$;
