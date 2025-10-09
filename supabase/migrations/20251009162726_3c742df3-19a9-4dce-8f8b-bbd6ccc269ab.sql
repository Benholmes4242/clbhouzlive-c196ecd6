-- 1) Add columns if missing for image metadata
ALTER TABLE post_media
  ADD COLUMN IF NOT EXISTS media_width INTEGER,
  ADD COLUMN IF NOT EXISTS media_height INTEGER,
  ADD COLUMN IF NOT EXISTS image_orientation TEXT CHECK (image_orientation IN ('portrait','landscape','square')),
  ADD COLUMN IF NOT EXISTS exif JSONB;

-- 2) Quick derived orientation if we already have width/height
UPDATE post_media
SET image_orientation = CASE
  WHEN media_width IS NULL OR media_height IS NULL THEN image_orientation
  WHEN media_width = media_height THEN 'square'
  WHEN media_width > media_height THEN 'landscape'
  ELSE 'portrait'
END
WHERE media_type = 'image' AND image_orientation IS NULL;

-- 3) Indexes used by Photos tab
CREATE INDEX IF NOT EXISTS idx_post_media_image_orientation
  ON post_media(image_orientation) WHERE media_type = 'image';

CREATE INDEX IF NOT EXISTS idx_post_media_wh
  ON post_media(media_width, media_height)
  WHERE media_type = 'image';