CREATE OR REPLACE FUNCTION public.user_top100_distinct_counts(p_user_id uuid)
RETURNS TABLE(slug text, course_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH user_courses AS (
    SELECT cr.course_id
    FROM course_ratings cr
    WHERE cr.user_id = p_user_id AND cr.rating IS NOT NULL
    UNION
    SELECT w.course_id
    FROM public.user_whs_played_golf_course_ids(p_user_id) w
  )
  SELECT l.slug::text,
         COUNT(DISTINCT m.course_id)::bigint AS course_count
  FROM top100_lists l
  LEFT JOIN course_top100_memberships m ON m.list_id = l.id
   AND m.course_id IN (SELECT uc.course_id FROM user_courses uc)
  WHERE l.is_active = true
  GROUP BY l.slug;
$function$;

GRANT EXECUTE ON FUNCTION public.user_top100_distinct_counts(uuid) TO authenticated, service_role;