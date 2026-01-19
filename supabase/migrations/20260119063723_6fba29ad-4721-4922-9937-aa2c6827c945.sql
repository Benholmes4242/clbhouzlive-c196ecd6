-- Add is_cover column for cover selection in course reviews
ALTER TABLE course_review_media ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT false;

-- Add title column for review titles (wizard step 2)
ALTER TABLE course_ratings ADD COLUMN IF NOT EXISTS title TEXT;

-- Create index for faster cover lookups
CREATE INDEX IF NOT EXISTS idx_course_review_media_is_cover ON course_review_media(review_id) WHERE is_cover = true;