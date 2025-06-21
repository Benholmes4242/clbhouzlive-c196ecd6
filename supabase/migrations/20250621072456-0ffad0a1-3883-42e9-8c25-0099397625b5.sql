
-- Drop the view that depends on the rating column
DROP VIEW IF EXISTS course_rating_stats;

-- Fix rating column precision to support ratings up to 10.0
ALTER TABLE course_ratings 
ALTER COLUMN rating TYPE numeric(3,1);

-- Recreate the course_rating_stats view with updated precision
CREATE VIEW course_rating_stats AS
SELECT 
    course_id,
    ROUND(AVG(rating), 1)::numeric(3,1) as average_rating,
    COUNT(rating) as total_ratings,
    COUNT(CASE WHEN review IS NOT NULL AND review != '' THEN 1 END) as total_reviews
FROM course_ratings
GROUP BY course_id;
