-- Add course_id column to posts table to store the real course reference
ALTER TABLE public.posts
ADD COLUMN course_id uuid REFERENCES public.golf_courses(id) ON DELETE SET NULL;

-- Create index for efficient course-based queries
CREATE INDEX idx_posts_course_id ON public.posts(course_id) WHERE course_id IS NOT NULL;

-- Add comment explaining the column purpose
COMMENT ON COLUMN public.posts.course_id IS 'Reference to golf_courses table for "Played at" context - NOT an @mention';