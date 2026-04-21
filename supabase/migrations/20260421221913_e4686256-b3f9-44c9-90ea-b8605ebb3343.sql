CREATE OR REPLACE FUNCTION public.get_user_passport(p_user_id uuid)
 RETURNS TABLE(
   courses_played integer,
   countries_played integer,
   avg_rating_given numeric,
   reviews_written integer,
   top_100_played integer,
   wishlist_count integer,
   friends_courses_to_try integer,
   first_play_year integer
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_played_courses uuid[];
  v_friends uuid[];
BEGIN
  SELECT COALESCE(ARRAY_AGG(DISTINCT uca.course_id), ARRAY[]::uuid[])
    INTO v_played_courses
  FROM user_course_activity uca
  WHERE uca.user_id = p_user_id
    AND uca.has_played = true;

  v_friends := public._get_user_friend_set(p_user_id);

  RETURN QUERY
  WITH played AS (
    SELECT DISTINCT gc.id AS course_id, gc.country, gc.sub_country
    FROM user_course_activity uca
    JOIN golf_courses gc ON gc.id = uca.course_id
    WHERE uca.user_id = p_user_id
      AND uca.has_played = true
  ),
  ratings AS (
    SELECT cr.rating, cr.review
    FROM course_ratings cr
    WHERE cr.user_id = p_user_id
  ),
  wish AS (
    SELECT cs.course_id
    FROM course_shortlists cs
    WHERE cs.user_id = p_user_id AND cs.list_key = 'want_to_play'
  ),
  friend_played AS (
    SELECT DISTINCT uca.course_id AS cid
    FROM user_course_activity uca
    WHERE uca.user_id = ANY(v_friends)
      AND uca.user_id <> p_user_id
      AND uca.has_played = true
  ),
  first_play AS (
    SELECT EXTRACT(YEAR FROM MIN(uca.played_at))::int AS yr
    FROM user_course_activity uca
    WHERE uca.user_id = p_user_id
      AND uca.has_played = true
      AND uca.played_at IS NOT NULL
  )
  SELECT
    (SELECT COUNT(*)::int FROM played),
    (SELECT COUNT(DISTINCT COALESCE(p.sub_country, p.country))::int FROM played p WHERE COALESCE(p.sub_country, p.country) IS NOT NULL),
    (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM ratings r WHERE r.rating IS NOT NULL),
    (SELECT COUNT(*)::int FROM ratings r WHERE r.review IS NOT NULL AND length(trim(r.review)) > 0),
    (SELECT COUNT(*)::int FROM played p
       WHERE EXISTS (SELECT 1 FROM course_top100_memberships ctm WHERE ctm.course_id = p.course_id)),
    (SELECT COUNT(*)::int FROM wish),
    (SELECT COUNT(*)::int FROM friend_played fp
       WHERE fp.cid <> ALL(v_played_courses)
       AND fp.cid NOT IN (SELECT course_id FROM wish)),
    (SELECT yr FROM first_play);
END;
$function$;