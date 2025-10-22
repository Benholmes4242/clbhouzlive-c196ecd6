-- Index for efficient vertical-only filtering in Clubhouse
-- Only indexes videos with complete metadata (not NULL)
CREATE INDEX IF NOT EXISTS idx_post_media_vertical_gate
ON post_media (aspect_ratio, duration_seconds)
WHERE media_type = 'video' 
  AND aspect_ratio IS NOT NULL 
  AND duration_seconds IS NOT NULL;