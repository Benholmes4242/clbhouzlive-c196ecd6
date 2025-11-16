-- EPIC D2: Create server-side search RPC function for courses
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
    -- Prioritize Top 100 courses
    CASE WHEN gc.global_rank IS NOT NULL THEN 0 ELSE 1 END,
    gc.global_rank NULLS LAST,
    gc.name
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Safe backfill function that handles rank conflicts
CREATE OR REPLACE FUNCTION backfill_course_top100_memberships()
RETURNS TABLE (
  status TEXT,
  list_slug TEXT,
  courses_added INT,
  courses_skipped INT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  list_rec RECORD;
  added_count INT;
  skipped_count INT;
  total_added INT := 0;
  total_skipped INT := 0;
BEGIN
  -- Process each list
  FOR list_rec IN 
    SELECT id, slug, name FROM top100_lists WHERE is_active = true ORDER BY slug
  LOOP
    added_count := 0;
    skipped_count := 0;
    
    -- Global list
    IF list_rec.slug = 'global' THEN
      INSERT INTO course_top100_memberships (course_id, list_id, rank)
      SELECT gc.id, list_rec.id, gc.global_rank
      FROM golf_courses gc
      WHERE gc.global_rank IS NOT NULL AND gc.global_rank > 0
      ON CONFLICT (course_id, list_id) DO NOTHING;
      GET DIAGNOSTICS added_count = ROW_COUNT;
      
      SELECT COUNT(*) INTO skipped_count
      FROM golf_courses gc
      WHERE gc.global_rank IS NOT NULL 
        AND gc.global_rank > 0
        AND NOT EXISTS (
          SELECT 1 FROM course_top100_memberships ctm
          WHERE ctm.course_id = gc.id AND ctm.list_id = list_rec.id
        );
    
    -- USA list
    ELSIF list_rec.slug = 'usa' THEN
      INSERT INTO course_top100_memberships (course_id, list_id, rank)
      SELECT gc.id, list_rec.id, gc.usa_rank
      FROM golf_courses gc
      WHERE gc.usa_rank IS NOT NULL AND gc.usa_rank > 0
      ON CONFLICT (course_id, list_id) DO NOTHING;
      GET DIAGNOSTICS added_count = ROW_COUNT;
      
      SELECT COUNT(*) INTO skipped_count
      FROM golf_courses gc
      WHERE gc.usa_rank IS NOT NULL 
        AND gc.usa_rank > 0
        AND NOT EXISTS (
          SELECT 1 FROM course_top100_memberships ctm
          WHERE ctm.course_id = gc.id AND ctm.list_id = list_rec.id
        );
    
    -- GB&I list
    ELSIF list_rec.slug = 'gb-i' THEN
      INSERT INTO course_top100_memberships (course_id, list_id, rank)
      SELECT gc.id, list_rec.id, gc.regional_rank
      FROM golf_courses gc
      WHERE gc.regional_rank IS NOT NULL 
        AND gc.regional_rank > 0
        AND gc.region = 'britain-ireland'
      ON CONFLICT (course_id, list_id) DO NOTHING;
      GET DIAGNOSTICS added_count = ROW_COUNT;
      
      SELECT COUNT(*) INTO skipped_count
      FROM golf_courses gc
      WHERE gc.regional_rank IS NOT NULL 
        AND gc.regional_rank > 0
        AND gc.region = 'britain-ireland'
        AND NOT EXISTS (
          SELECT 1 FROM course_top100_memberships ctm
          WHERE ctm.course_id = gc.id AND ctm.list_id = list_rec.id
        );
    
    -- Europe list (skip if rank conflicts)
    ELSIF list_rec.slug = 'europe' THEN
      INSERT INTO course_top100_memberships (course_id, list_id, rank)
      SELECT gc.id, list_rec.id, gc.regional_rank
      FROM golf_courses gc
      WHERE gc.regional_rank IS NOT NULL 
        AND gc.regional_rank > 0
        AND gc.region = 'europe'
        AND NOT EXISTS (
          SELECT 1 FROM course_top100_memberships ctm
          WHERE ctm.list_id = list_rec.id AND ctm.rank = gc.regional_rank
        )
      ON CONFLICT (course_id, list_id) DO NOTHING;
      GET DIAGNOSTICS added_count = ROW_COUNT;
      
      SELECT COUNT(*) INTO skipped_count
      FROM golf_courses gc
      WHERE gc.regional_rank IS NOT NULL 
        AND gc.regional_rank > 0
        AND gc.region = 'europe'
        AND NOT EXISTS (
          SELECT 1 FROM course_top100_memberships ctm
          WHERE ctm.course_id = gc.id AND ctm.list_id = list_rec.id
        );
    END IF;
    
    total_added := total_added + added_count;
    total_skipped := total_skipped + skipped_count;
    
    RETURN QUERY SELECT 
      'success'::TEXT,
      list_rec.slug,
      added_count,
      skipped_count,
      format('Added %s courses, skipped %s due to conflicts', added_count, skipped_count);
  END LOOP;
  
  RETURN QUERY SELECT 
    'complete'::TEXT,
    'all'::TEXT,
    total_added,
    total_skipped,
    format('Total: Added %s courses, skipped %s', total_added, total_skipped);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_golf_courses TO authenticated, anon;
GRANT EXECUTE ON FUNCTION backfill_course_top100_memberships TO authenticated;