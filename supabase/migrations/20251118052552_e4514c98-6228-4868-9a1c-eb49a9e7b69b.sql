-- Add filter_id column to post_media if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_media' 
    AND column_name = 'filter_id'
  ) THEN
    ALTER TABLE post_media ADD COLUMN filter_id text;
    CREATE INDEX IF NOT EXISTS idx_post_media_filter_id ON post_media(filter_id);
  END IF;
END $$;