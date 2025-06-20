
-- Move all GB&I courses that were incorrectly placed in Europe continent
-- Update countries to match the expected GB&I country names
UPDATE public.golf_courses 
SET country = CASE
  WHEN country = 'United Kingdom' THEN 'England'  -- Default UK to England for now
  WHEN country = 'Scotland' THEN 'Scotland'
  WHEN country = 'Wales' THEN 'Wales' 
  WHEN country = 'Northern Ireland' THEN 'Northern Ireland'
  WHEN country = 'Ireland' THEN 'Ireland'
  WHEN country = 'Isle of Man' THEN 'Isle of Man'
  ELSE country
END
WHERE country IN ('United Kingdom', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Isle of Man')
  OR (country = 'England' AND continent = 'Europe');

-- For any remaining European courses that should be Continental Europe
-- (this will help distinguish them from GB&I)
UPDATE public.golf_courses 
SET continent = 'Continental Europe'
WHERE continent = 'Europe' 
  AND country NOT IN ('England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Isle of Man');
