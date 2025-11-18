-- Add display_order column to post_media table
ALTER TABLE post_media
ADD COLUMN IF NOT EXISTS display_order integer;

COMMENT ON COLUMN post_media.display_order IS 'Order of media items in a post (0-indexed)';
