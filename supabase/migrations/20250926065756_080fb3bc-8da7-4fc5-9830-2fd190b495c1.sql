-- Add media dimensions and aspect ratio columns to post_media
ALTER TABLE post_media
  ADD COLUMN width int,
  ADD COLUMN height int,
  ADD COLUMN aspect_ratio numeric(6,4),
  ADD COLUMN orientation text CHECK (orientation IN ('portrait','landscape','square'));

-- Add index for fast filtering by aspect ratio
CREATE INDEX IF NOT EXISTS idx_post_media_aspect ON post_media (aspect_ratio);

-- Add index for performance on multi-media post queries
CREATE INDEX IF NOT EXISTS idx_post_media_post_id_aspect ON post_media (post_id, aspect_ratio);