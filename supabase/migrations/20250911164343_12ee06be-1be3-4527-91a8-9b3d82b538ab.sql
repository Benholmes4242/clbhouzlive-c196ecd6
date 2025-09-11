-- Add poster_url and stream_id columns to media tables
ALTER TABLE post_media ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE post_media ADD COLUMN IF NOT EXISTS stream_id TEXT;

ALTER TABLE course_review_media ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE course_review_media ADD COLUMN IF NOT EXISTS stream_id TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_post_media_stream_id ON post_media(stream_id);
CREATE INDEX IF NOT EXISTS idx_course_review_media_stream_id ON course_review_media(stream_id);