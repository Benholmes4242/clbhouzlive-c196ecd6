CREATE OR REPLACE FUNCTION public.gam_user_courses()
RETURNS TABLE(course_id uuid, course_name text, rounds_count bigint, last_played timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH mapped AS (
    SELECT
      COALESCE(m.golf_course_id, s.course_id) AS gc_id,
      s.capture_date
    FROM whs_scores s
    JOIN whs_connections wc ON wc.id = s.connection_id AND wc.deleted_at IS NULL
    LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = s.course_id
    WHERE wc.user_id = v_uid
      AND s.is_penalty_score = false
      AND s.course_id IS NOT NULL
  )
  SELECT
    gc.id,
    gc.name,
    COUNT(*)::bigint,
    MAX(mapped.capture_date)
  FROM mapped
  JOIN golf_courses gc ON gc.id = mapped.gc_id
  GROUP BY gc.id, gc.name
  ORDER BY COUNT(*) DESC, MAX(mapped.capture_date) DESC NULLS LAST;
END;
$function$;

REVOKE ALL ON FUNCTION public.gam_user_courses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gam_user_courses() TO authenticated;