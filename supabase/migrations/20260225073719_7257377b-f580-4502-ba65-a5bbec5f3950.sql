
CREATE OR REPLACE FUNCTION public.explore_courses_by_rating(
  p_country text DEFAULT NULL,
  p_sub_country text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  country text,
  region text,
  continent public.continent,
  latitude numeric,
  longitude numeric,
  global_rank int,
  regional_rank int,
  description text,
  thumbnail_image text,
  website_url text,
  top100_url text,
  created_at timestamptz,
  updated_at timestamptz,
  usa_rank int,
  sub_country text,
  country_rank int,
  club_id uuid,
  region_key text,
  course_type public.course_type,
  has_hosted_major boolean,
  major_championships text[],
  country_code character(1),
  average_rating numeric
)
LANGUAGE sql STABLE
AS $$
  SELECT
    gc.id, gc.name, gc.country, gc.region, gc.continent,
    gc.latitude, gc.longitude, gc.global_rank, gc.regional_rank,
    gc.description, gc.thumbnail_image, gc.website_url, gc.top100_url,
    gc.created_at, gc.updated_at, gc.usa_rank, gc.sub_country,
    gc.country_rank, gc.club_id, gc.region_key, gc.course_type,
    gc.has_hosted_major, gc.major_championships, gc.country_code,
    cra.avg_overall_score AS average_rating
  FROM public.golf_courses gc
  LEFT JOIN public.course_rating_aggregates cra ON cra.course_id = gc.id
  WHERE
    (p_country IS NULL OR gc.country = p_country)
    AND (p_sub_country IS NULL OR gc.sub_country = p_sub_country)
    AND (p_search IS NULL OR gc.name ILIKE '%' || p_search || '%')
  ORDER BY COALESCE(cra.avg_overall_score, -1) DESC, gc.name ASC
  LIMIT p_limit OFFSET p_offset;
$$;
