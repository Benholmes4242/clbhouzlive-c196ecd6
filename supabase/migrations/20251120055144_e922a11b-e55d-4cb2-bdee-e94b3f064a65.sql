-- Fix Top 100 list sorting to use region-specific ranks
-- This replaces the search_golf_courses function to sort by the correct rank column
-- based on which Top 100 list is selected

CREATE OR REPLACE FUNCTION search_golf_courses(
  search_query TEXT DEFAULT NULL,
  region_slug TEXT DEFAULT NULL,
  list_slug TEXT DEFAULT NULL,
  country_filter TEXT DEFAULT NULL,
  limit_count INT DEFAULT 40,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  sub_country TEXT,
  region TEXT,
  continent TEXT,
  global_rank INT,
  regional_rank INT,
  usa_rank INT,
  country_rank INT,
  thumbnail_image TEXT,
  description TEXT,
  website_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  top100_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  list_memberships JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    gc.name,
    gc.country,
    gc.sub_country,
    gc.region,
    gc.continent::TEXT,
    gc.global_rank,
    gc.regional_rank,
    gc.usa_rank,
    gc.country_rank,
    gc.thumbnail_image,
    gc.description,
    gc.website_url,
    gc.latitude,
    gc.longitude,
    gc.top100_url,
    gc.created_at,
    gc.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'list_id', ctm.list_id,
            'list_slug', tl.slug,
            'list_name', tl.name,
            'rank', ctm.rank
          )
        )
        FROM course_top100_memberships ctm
        JOIN top100_lists tl ON tl.id = ctm.list_id
        WHERE ctm.course_id = gc.id
      ),
      '[]'::jsonb
    ) as list_memberships
  FROM golf_courses gc
  WHERE 
    -- Search filter
    (
      search_query IS NULL 
      OR gc.name ILIKE '%' || search_query || '%'
      OR gc.country ILIKE '%' || search_query || '%'
      OR gc.sub_country ILIKE '%' || search_query || '%'
      OR gc.region ILIKE '%' || search_query || '%'
    )
    -- Region filter
    AND (
      region_slug IS NULL
      OR gc.region = region_slug
    )
    -- Country filter
    AND (
      country_filter IS NULL
      OR gc.country = country_filter
    )
    -- Top 100 list filter
    AND (
      list_slug IS NULL
      OR EXISTS (
        SELECT 1 FROM course_top100_memberships ctm
        JOIN top100_lists tl ON tl.id = ctm.list_id
        WHERE ctm.course_id = gc.id AND tl.slug = list_slug
      )
    )
  ORDER BY 
    -- Sort by the appropriate rank column based on the selected list
    CASE
      WHEN list_slug = 'global' THEN 
        CASE WHEN gc.global_rank IS NOT NULL THEN 0 ELSE 1 END
      WHEN list_slug = 'usa' THEN 
        CASE WHEN gc.usa_rank IS NOT NULL THEN 0 ELSE 1 END
      WHEN list_slug IN ('gb-i', 'europe') THEN 
        CASE WHEN gc.regional_rank IS NOT NULL THEN 0 ELSE 1 END
      ELSE 1
    END,
    -- Use the specific rank column for sorting
    CASE
      WHEN list_slug = 'global' THEN gc.global_rank
      WHEN list_slug = 'usa' THEN gc.usa_rank
      WHEN list_slug IN ('gb-i', 'europe') THEN gc.regional_rank
      ELSE NULL
    END NULLS LAST,
    gc.name
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Ensure permissions are maintained
GRANT EXECUTE ON FUNCTION search_golf_courses TO authenticated, anon;