-- Fix #1: Make review_id nullable to avoid using placeholder UUIDs for pending videos
-- This allows us to insert pending videos without a fake review_id

ALTER TABLE public.course_review_media 
  ALTER COLUMN review_id DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.course_review_media.review_id IS 
  'References course_ratings.id - NULL for pending uploads that have not been attached to a review yet';