
-- Make user_id nullable to align with ON DELETE SET NULL foreign key
ALTER TABLE public.course_ratings 
ALTER COLUMN user_id DROP NOT NULL;

-- Add unique constraint to ensure one rating per user per course
ALTER TABLE public.course_ratings
ADD CONSTRAINT course_ratings_user_course_unique 
UNIQUE (user_id, course_id);

-- Add index for performance on (user_id, course_id) lookups
CREATE INDEX IF NOT EXISTS idx_course_ratings_user_course 
ON public.course_ratings (user_id, course_id);
