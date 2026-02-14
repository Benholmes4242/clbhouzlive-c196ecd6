
-- Add thru_updated_at column to sr_leaderboards
ALTER TABLE sr_leaderboards
ADD COLUMN IF NOT EXISTS thru_updated_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN sr_leaderboards.thru_updated_at IS
'Timestamp of when thru value last changed. Only updated when thru value differs from previous. Used by formatThruDisplay to determine if F is from today vs carried over from previous day.';

-- Create trigger function to auto-set thru_updated_at when thru changes
CREATE OR REPLACE FUNCTION public.update_thru_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.thru IS DISTINCT FROM NEW.thru THEN
    NEW.thru_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger on sr_leaderboards
CREATE TRIGGER trg_thru_updated
BEFORE UPDATE ON sr_leaderboards
FOR EACH ROW
EXECUTE FUNCTION public.update_thru_timestamp();
