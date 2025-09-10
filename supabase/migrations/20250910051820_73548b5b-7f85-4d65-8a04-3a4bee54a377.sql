-- Add comment to golf_courses table for better documentation
COMMENT ON COLUMN public.golf_courses.country IS 'Primary region (Britain & Ireland, USA, Continental Europe)';
COMMENT ON COLUMN public.golf_courses.sub_country IS 'Specific country/state within the primary region';

-- Update any existing check constraints if they exist to ensure the new countries are accepted
-- Note: This is informational - the frontend dropdown now includes all the new countries