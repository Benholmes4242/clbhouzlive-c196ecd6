
-- Fix rating column precision to support ratings up to 10.0
ALTER TABLE course_ratings 
ALTER COLUMN rating TYPE numeric(3,1);

-- Also update the course_rating_stats view if it exists
-- This ensures the average_rating can also handle the full range
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'course_rating_stats' 
               AND column_name = 'average_rating') THEN
        ALTER TABLE course_rating_stats 
        ALTER COLUMN average_rating TYPE numeric(3,1);
    END IF;
END $$;
