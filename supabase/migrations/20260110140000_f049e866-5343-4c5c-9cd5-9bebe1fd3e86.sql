-- Add normalized college column to sr_players for efficient lookups
-- This avoids the need to fetch all players and filter client-side

-- Add the column
ALTER TABLE public.sr_players 
ADD COLUMN IF NOT EXISTS college_normalized TEXT;

-- Populate using the same normalization function
UPDATE public.sr_players
SET college_normalized = public.normalize_college_name(college)
WHERE college IS NOT NULL AND college != '';

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sr_players_college_normalized 
ON public.sr_players(college_normalized)
WHERE college_normalized IS NOT NULL AND college_normalized != '';

-- Create trigger to auto-update on insert/update
CREATE OR REPLACE FUNCTION public.set_player_college_normalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.college IS NOT NULL AND NEW.college != '' THEN
    NEW.college_normalized := public.normalize_college_name(NEW.college);
  ELSE
    NEW.college_normalized := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_set_player_college_normalized ON public.sr_players;
CREATE TRIGGER trigger_set_player_college_normalized
BEFORE INSERT OR UPDATE OF college ON public.sr_players
FOR EACH ROW
EXECUTE FUNCTION public.set_player_college_normalized();