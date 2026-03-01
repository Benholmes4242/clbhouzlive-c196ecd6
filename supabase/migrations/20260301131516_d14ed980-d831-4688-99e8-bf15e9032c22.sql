
-- Add poster frame timestamp to post_media
-- NULL means default (1 second), matching current behavior
ALTER TABLE post_media
  ADD COLUMN IF NOT EXISTS poster_timestamp NUMERIC NULL;

-- Validation: must be non-negative
CREATE OR REPLACE FUNCTION validate_poster_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.poster_timestamp IS NOT NULL AND NEW.poster_timestamp < 0 THEN
    RAISE EXCEPTION 'poster_timestamp must be non-negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_poster_timestamp
  BEFORE INSERT OR UPDATE ON post_media
  FOR EACH ROW
  WHEN (NEW.poster_timestamp IS NOT NULL)
  EXECUTE FUNCTION validate_poster_timestamp();
