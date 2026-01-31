-- Add PGA Tour ID column for Cloudinary headshot URLs
ALTER TABLE public.sr_players
ADD COLUMN IF NOT EXISTS pga_tour_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sr_players_pga_tour_id ON public.sr_players(pga_tour_id) WHERE pga_tour_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.sr_players.pga_tour_id IS 'Official PGA Tour player ID used for Cloudinary headshot URLs';