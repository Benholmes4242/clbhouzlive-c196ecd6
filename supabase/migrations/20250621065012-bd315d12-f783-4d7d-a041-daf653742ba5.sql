
-- Update the course_ratings table to include written reviews and ensure proper constraints
ALTER TABLE public.course_ratings 
ADD COLUMN IF NOT EXISTS review TEXT,
ADD COLUMN IF NOT EXISTS review_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update the rating constraint to allow 0.5 increments from 0 to 10
ALTER TABLE public.course_ratings 
DROP CONSTRAINT IF EXISTS course_ratings_rating_check;

ALTER TABLE public.course_ratings 
ADD CONSTRAINT course_ratings_rating_check 
CHECK (rating >= 0 AND rating <= 10 AND (rating * 2) = FLOOR(rating * 2));

-- Update the course_rating_stats view to be more comprehensive
DROP VIEW IF EXISTS public.course_rating_stats;

CREATE OR REPLACE VIEW public.course_rating_stats AS
SELECT 
  course_id,
  ROUND(AVG(rating), 1) as average_rating,
  COUNT(*) as total_ratings,
  COUNT(CASE WHEN review IS NOT NULL AND review != '' THEN 1 END) as total_reviews
FROM public.course_ratings
GROUP BY course_id;
