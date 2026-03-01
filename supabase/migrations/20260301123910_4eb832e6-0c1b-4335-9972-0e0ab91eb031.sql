-- Add trim range columns to post_media
-- NULL means no trim (play full video)
ALTER TABLE post_media
  ADD COLUMN IF NOT EXISTS trim_start NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS trim_end NUMERIC NULL;

-- Validation trigger: trim_end must be > trim_start, both must be non-negative
CREATE OR REPLACE FUNCTION validate_trim_range()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trim_start IS NOT NULL AND NEW.trim_start < 0 THEN
    RAISE EXCEPTION 'trim_start must be non-negative';
  END IF;
  IF NEW.trim_end IS NOT NULL AND NEW.trim_end < 0 THEN
    RAISE EXCEPTION 'trim_end must be non-negative';
  END IF;
  IF NEW.trim_start IS NOT NULL AND NEW.trim_end IS NOT NULL AND NEW.trim_end <= NEW.trim_start THEN
    RAISE EXCEPTION 'trim_end must be greater than trim_start';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_trim_range
  BEFORE INSERT OR UPDATE ON post_media
  FOR EACH ROW
  WHEN (NEW.trim_start IS NOT NULL OR NEW.trim_end IS NOT NULL)
  EXECUTE FUNCTION validate_trim_range();