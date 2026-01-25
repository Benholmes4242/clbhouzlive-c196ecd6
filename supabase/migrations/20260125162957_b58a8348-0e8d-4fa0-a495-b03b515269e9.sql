-- Fix the get_course_hall_of_fame RPC - disambiguate course_id
CREATE OR REPLACE FUNCTION public.get_course_hall_of_fame()
RETURNS TABLE(
  course_id uuid,
  course_name text,
  location text,
  thumbnail_url text,
  lifetime_plays bigint,
  lifetime_avg_rating numeric,
  season_wins integer,
  hall_of_fame_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  -- Most Played (Top 3)
  (
    SELECT 
      gc.id AS course_id,
      gc.name AS course_name,
      COALESCE(gc.sub_country, gc.country) AS location,
      gc.thumbnail_image AS thumbnail_url,
      COUNT(cr.id) AS lifetime_plays,
      ROUND(AVG(cr.rating), 1) AS lifetime_avg_rating,
      (SELECT COUNT(*)::integer FROM course_prestige_tags cpt WHERE cpt.course_id = gc.id AND cpt.tag_type = 'season_winner') AS season_wins,
      'most_played'::text AS hall_of_fame_category
    FROM golf_courses gc
    LEFT JOIN course_ratings cr ON gc.id = cr.course_id AND cr.is_mock = false
    WHERE gc.global_rank IS NOT NULL 
       OR gc.regional_rank IS NOT NULL 
       OR gc.usa_rank IS NOT NULL
    GROUP BY gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image
    ORDER BY COUNT(cr.id) DESC
    LIMIT 3
  )
  UNION ALL
  -- Highest Rated (Top 3, min 5 ratings)
  (
    SELECT 
      gc.id AS course_id,
      gc.name AS course_name,
      COALESCE(gc.sub_country, gc.country) AS location,
      gc.thumbnail_image AS thumbnail_url,
      COUNT(cr.id) AS lifetime_plays,
      ROUND(AVG(cr.rating), 1) AS lifetime_avg_rating,
      (SELECT COUNT(*)::integer FROM course_prestige_tags cpt WHERE cpt.course_id = gc.id AND cpt.tag_type = 'season_winner') AS season_wins,
      'highest_rated'::text AS hall_of_fame_category
    FROM golf_courses gc
    LEFT JOIN course_ratings cr ON gc.id = cr.course_id AND cr.is_mock = false
    WHERE gc.global_rank IS NOT NULL 
       OR gc.regional_rank IS NOT NULL 
       OR gc.usa_rank IS NOT NULL
    GROUP BY gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image
    HAVING COUNT(cr.id) >= 5
    ORDER BY AVG(cr.rating) DESC
    LIMIT 3
  );
END;
$function$;