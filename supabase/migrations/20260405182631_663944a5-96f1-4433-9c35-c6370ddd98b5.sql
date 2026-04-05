
CREATE OR REPLACE FUNCTION get_course_of_the_week()
RETURNS TABLE (
  course_id       uuid,
  course_name     text,
  country         text,
  sub_country     text,
  thumbnail_image text,
  description     text,
  global_rank     integer,
  avg_rating      numeric,
  review_count    bigint,
  week_label      text
)
LANGUAGE sql
STABLE
AS $$
  WITH reviewed_courses AS (
    SELECT
      gc.id,
      gc.name,
      gc.country,
      gc.sub_country,
      gc.thumbnail_image,
      gc.description,
      gc.global_rank,
      ROUND(AVG(cr.rating)::numeric, 1) AS avg_rating,
      COUNT(cr.id)                      AS review_count
    FROM golf_courses gc
    JOIN course_ratings cr ON cr.course_id = gc.id
    WHERE gc.thumbnail_image IS NOT NULL
    GROUP BY gc.id
    HAVING COUNT(cr.id) >= 1
    ORDER BY gc.id
  ),
  week_pick AS (
    SELECT *
    FROM reviewed_courses
    OFFSET (EXTRACT(WEEK FROM CURRENT_DATE)::int % (SELECT COUNT(*) FROM reviewed_courses))
    LIMIT 1
  )
  SELECT
    wp.id,
    wp.name,
    wp.country,
    wp.sub_country,
    wp.thumbnail_image,
    wp.description,
    wp.global_rank,
    wp.avg_rating,
    wp.review_count,
    'Week ' || EXTRACT(WEEK FROM CURRENT_DATE)::text || ', ' || EXTRACT(YEAR FROM CURRENT_DATE)::text AS week_label
  FROM week_pick wp;
$$;

GRANT EXECUTE ON FUNCTION get_course_of_the_week() TO anon, authenticated;
