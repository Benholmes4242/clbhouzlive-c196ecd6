
-- Add missing earnings columns to sr_player_statistics
ALTER TABLE public.sr_player_statistics 
  ADD COLUMN IF NOT EXISTS earnings NUMERIC,
  ADD COLUMN IF NOT EXISTS earnings_rank INTEGER;
