-- Fix GBI region mapping for Britain & Ireland courses
UPDATE golf_courses
SET region_key = 'GBI'
WHERE region_key IS DISTINCT FROM 'GBI'
  AND lower(country) SIMILAR TO '%(britain|ireland|united kingdom|great britain|england|scotland|wales|northern ireland|republic of ireland|eire)%';

-- Also fix exact match for 'Britain & Ireland' which has 2312 courses
UPDATE golf_courses
SET region_key = 'GBI'
WHERE country = 'Britain & Ireland' AND (region_key IS NULL OR region_key != 'GBI');

-- Fix Scotland explicitly
UPDATE golf_courses
SET region_key = 'GBI'
WHERE country = 'Scotland' AND (region_key IS NULL OR region_key != 'GBI');