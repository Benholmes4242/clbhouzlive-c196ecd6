-- Add duration columns to post_media table
ALTER TABLE post_media
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS duration_ms bigint;

-- Add constraint to ensure duration_seconds is non-negative
ALTER TABLE post_media
  ADD CONSTRAINT duration_seconds_nonneg CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

-- Add index to speed up Shorts queries
CREATE INDEX IF NOT EXISTS idx_post_media_type_duration
  ON post_media (media_type, duration_seconds);