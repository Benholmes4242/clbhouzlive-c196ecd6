-- Drop and recreate backfill function
DROP FUNCTION IF EXISTS backfill_course_top100_memberships();

CREATE FUNCTION backfill_course_top100_memberships()
RETURNS TABLE (
  status TEXT,
  list_slug TEXT,
  courses_added INT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  list_rec RECORD;
  added_count INT;
BEGIN
  FOR list_rec IN 
    SELECT id, slug FROM top100_lists WHERE is_active = true ORDER BY slug
  LOOP
    IF list_rec.slug = 'global' THEN
      WITH ranked_courses AS (
        SELECT 
          id as course_id, 
          global_rank,
          ROW_NUMBER() OVER (PARTITION BY global_rank ORDER BY name) as rn
        FROM golf_courses 
        WHERE global_rank IS NOT NULL AND global_rank > 0
      )
      INSERT INTO course_top100_memberships (course_id, list_id, rank)
      SELECT course_id, list_rec.id, global_rank
      FROM ranked_courses
      WHERE rn = 1
      ON CONFLICT (course_id, list_id) DO NOTHING;
      GET DIAGNOSTICS added_count = ROW_COUNT;
      
    ELSIF list_rec.slug = 'usa' THEN
      WITH ranked_courses AS (
        SELECT 
          id as course_id,
          usa_rank,
          ROW_NUMBER() OVER (PARTITION BY usa_rank ORDER BY name) as rn
        FROM golf_courses
        WHERE usa_rank IS NOT NULL AND usa_rank > 0
      )
      INSERT INTO course_top100_memberships (course_id, list_id, rank)
      SELECT course_id, list_rec.id, usa_rank
      FROM ranked_courses
      WHERE rn = 1
      ON CONFLICT (course_id, list_id) DO NOTHING;
      GET DIAGNOSTICS added_count = ROW_COUNT;
      
    ELSIF list_rec.slug = 'gb-i' THEN
      WITH ranked_courses AS (
        SELECT 
          id as course_id,
          regional_rank,
          ROW_NUMBER() OVER (PARTITION BY regional_rank ORDER BY name) as rn
        FROM golf_courses
        WHERE regional_rank IS NOT NULL 
          AND regional_rank > 0
          AND region = 'britain-ireland'
      )
      INSERT INTO course_top100_memberships (course_id, list_id, rank)
      SELECT course_id, list_rec.id, regional_rank
      FROM ranked_courses
      WHERE rn = 1
      ON CONFLICT (course_id, list_id) DO NOTHING;
      GET DIAGNOSTICS added_count = ROW_COUNT;
      
    ELSIF list_rec.slug = 'europe' THEN
      WITH ranked_courses AS (
        SELECT 
          id as course_id,
          regional_rank,
          ROW_NUMBER() OVER (PARTITION BY regional_rank ORDER BY name) as rn
        FROM golf_courses
        WHERE regional_rank IS NOT NULL 
          AND regional_rank > 0
          AND region = 'europe'
      )
      INSERT INTO course_top100_memberships (course_id, list_id, rank)
      SELECT course_id, list_rec.id, regional_rank
      FROM ranked_courses
      WHERE rn = 1
      ON CONFLICT (course_id, list_id) DO NOTHING;
      GET DIAGNOSTICS added_count = ROW_COUNT;
    END IF;
    
    RETURN QUERY SELECT 
      'success'::TEXT,
      list_rec.slug,
      added_count,
      format('%s courses added to %s list', added_count, list_rec.slug);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION backfill_course_top100_memberships TO authenticated;