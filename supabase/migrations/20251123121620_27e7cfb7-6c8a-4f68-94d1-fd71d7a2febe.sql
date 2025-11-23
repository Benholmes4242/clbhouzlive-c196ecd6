
-- Phase 3: Add unique constraint to prevent future duplicates
ALTER TABLE golf_courses
ADD CONSTRAINT golf_courses_unique_name_country_sub
UNIQUE (name, country, sub_country);
