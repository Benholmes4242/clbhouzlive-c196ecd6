CREATE OR REPLACE FUNCTION public.get_top100_list_progress(
  p_list_slug text,
  p_owner_user_id uuid,
  p_viewer_user_id uuid
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  thumbnail_image text,
  country text,
  region text,
  rank integer,
  is_owner_played boolean,
  is_viewer_played boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    gc.id              AS course_id,
    gc.name            AS course_name,
    gc.thumbnail_image,
    gc.country,
    gc.region,
    ctm.rank,
    EXISTS (
      SELECT 1 FROM course_ratings cr
      WHERE cr.course_id = ctm.course_id
        AND cr.user_id = p_owner_user_id
        AND cr.rating IS NOT NULL
    ) AS is_owner_played,
    EXISTS (
      SELECT 1 FROM course_ratings cr
      WHERE cr.course_id = ctm.course_id
        AND cr.user_id = p_viewer_user_id
        AND cr.rating IS NOT NULL
    ) AS is_viewer_played
  FROM top100_lists tl
  JOIN course_top100_memberships ctm ON ctm.list_id = tl.id
  JOIN golf_courses gc ON gc.id = ctm.course_id
  WHERE tl.slug = p_list_slug
    AND tl.is_active = true
  ORDER BY ctm.rank ASC NULLS LAST, gc.name ASC;
$function$;

GRANT EXECUTE ON FUNCTION public.get_top100_list_progress(text, uuid, uuid) TO authenticated;