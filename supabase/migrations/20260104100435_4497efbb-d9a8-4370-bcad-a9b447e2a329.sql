-- Add source_review_id to posts table to link review posts to their source rating
-- This enables idempotency checks and allows identifying review-type posts

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS source_review_id uuid NULL;

-- Add index for efficient lookup of posts by review
CREATE INDEX IF NOT EXISTS posts_source_review_id_idx
ON public.posts(source_review_id);

-- Add foreign key constraint to course_ratings (optional, for data integrity)
ALTER TABLE public.posts
ADD CONSTRAINT posts_source_review_id_fkey
FOREIGN KEY (source_review_id) REFERENCES public.course_ratings(id)
ON DELETE SET NULL;