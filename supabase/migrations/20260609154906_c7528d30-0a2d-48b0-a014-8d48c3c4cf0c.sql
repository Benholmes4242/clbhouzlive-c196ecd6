CREATE OR REPLACE FUNCTION public.user_whs_played_golf_course_ids(p_user_id uuid)
RETURNS TABLE (course_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT wca.course_id
  FROM whs_scores ws
  JOIN whs_connections wc ON wc.id = ws.connection_id
  JOIN whs_courses whc ON whc.id = ws.course_id
  JOIN whs_course_aliases wca
    ON lower(trim(wca.whs_name)) = lower(trim(whc.name))
  WHERE wc.user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.user_whs_played_golf_course_ids(uuid) TO authenticated, service_role;