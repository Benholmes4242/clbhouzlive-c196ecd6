
-- Add missing columns to golf_courses table
ALTER TABLE public.golf_courses 
ADD COLUMN sub_country TEXT,
ADD COLUMN country_rank INTEGER;

-- Update existing records to have empty sub_country values
UPDATE public.golf_courses 
SET sub_country = NULL 
WHERE sub_country IS NULL;
