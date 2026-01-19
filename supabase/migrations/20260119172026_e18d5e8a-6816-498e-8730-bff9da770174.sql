-- Add dimension columns to course_review_media table
-- Matches the schema from post_media for consistency

ALTER TABLE public.course_review_media
ADD COLUMN IF NOT EXISTS width integer,
ADD COLUMN IF NOT EXISTS height integer,
ADD COLUMN IF NOT EXISTS aspect_ratio numeric,
ADD COLUMN IF NOT EXISTS duration_seconds integer,
ADD COLUMN IF NOT EXISTS orientation text;

-- Add comment for documentation
COMMENT ON COLUMN public.course_review_media.width IS 'Video/image width in pixels';
COMMENT ON COLUMN public.course_review_media.height IS 'Video/image height in pixels';
COMMENT ON COLUMN public.course_review_media.aspect_ratio IS 'Calculated as width/height';
COMMENT ON COLUMN public.course_review_media.duration_seconds IS 'Video duration in seconds';
COMMENT ON COLUMN public.course_review_media.orientation IS 'portrait, landscape, or square';