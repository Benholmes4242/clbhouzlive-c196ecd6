-- Step 1: Fix the data anomaly - move "Scotland" region course to "Britain & Ireland"
UPDATE golf_courses 
SET country = 'Britain & Ireland', sub_country = 'Scotland'
WHERE country = 'Scotland';

-- Step 2: Create RPC for getting all regions (country field)
CREATE OR REPLACE FUNCTION get_course_regions()
RETURNS TABLE(region_name text, course_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT country AS region_name, COUNT(*) as course_count
  FROM golf_courses
  WHERE country IS NOT NULL
  GROUP BY country
  ORDER BY 
    CASE country
      WHEN 'Britain & Ireland' THEN 1
      WHEN 'USA' THEN 2
      WHEN 'Continental Europe' THEN 3
      WHEN 'Asia' THEN 4
      WHEN 'Oceania' THEN 5
      WHEN 'Middle East' THEN 6
      WHEN 'Africa' THEN 7
      WHEN 'Caribbean' THEN 8
      WHEN 'Central and South America' THEN 9
      ELSE 10
    END,
    country;
$$;

-- Step 3: Create RPC for getting sub-regions for a specific region
CREATE OR REPLACE FUNCTION get_course_sub_regions(p_region text)
RETURNS TABLE(sub_region_name text, course_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sub_country AS sub_region_name, COUNT(*) as course_count
  FROM golf_courses
  WHERE country = p_region
    AND sub_country IS NOT NULL
  GROUP BY sub_country
  ORDER BY sub_country;
$$;