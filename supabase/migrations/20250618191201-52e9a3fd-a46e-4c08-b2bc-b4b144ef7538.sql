
-- Fix the GB&I regional rankings properly
-- Reset all GB&I rankings first
UPDATE public.golf_courses 
SET regional_rank = NULL 
WHERE country IN ('United Kingdom', 'Ireland');

-- Assign regional rankings to ALL GB&I courses based on their global rank order
-- This will give them sequential regional rankings 1, 2, 3, etc. in the order they appear globally
WITH gbi_courses AS (
  SELECT id, global_rank,
    ROW_NUMBER() OVER (ORDER BY global_rank) as new_regional_rank
  FROM public.golf_courses 
  WHERE country IN ('United Kingdom', 'Ireland') 
    AND global_rank IS NOT NULL
)
UPDATE public.golf_courses 
SET regional_rank = gbi_courses.new_regional_rank
FROM gbi_courses 
WHERE public.golf_courses.id = gbi_courses.id;
