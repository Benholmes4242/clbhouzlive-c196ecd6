-- Add performance index for Shorts filter
-- This speeds up queries for videos <= 180 seconds
CREATE INDEX IF NOT EXISTS idx_post_media_video_short
  ON post_media (media_type, duration_seconds)
  WHERE media_type = 'video';