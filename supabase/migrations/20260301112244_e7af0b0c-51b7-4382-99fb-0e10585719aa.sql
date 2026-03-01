-- Add per-item upload tracking to post_media
ALTER TABLE post_media
  ADD COLUMN IF NOT EXISTS upload_status TEXT NOT NULL DEFAULT 'completed';

-- Add validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION validate_upload_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.upload_status NOT IN ('pending', 'uploading', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid upload_status: %', NEW.upload_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_upload_status
  BEFORE INSERT OR UPDATE ON post_media
  FOR EACH ROW
  EXECUTE FUNCTION validate_upload_status();

-- Partial index for querying failed items efficiently
CREATE INDEX IF NOT EXISTS idx_post_media_upload_status_failed
  ON post_media (post_id)
  WHERE upload_status = 'failed';