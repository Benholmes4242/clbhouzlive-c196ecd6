CREATE OR REPLACE FUNCTION get_course_countries()
RETURNS TABLE(country_name text, course_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT country AS country_name, COUNT(*) as course_count
  FROM golf_courses
  WHERE country IS NOT NULL
  GROUP BY country
  ORDER BY country;
$$;