-- Add handicap sync interest fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS handicap_sync_interest boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS handicap_sync_interest_at timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.handicap_sync_interest IS 'Whether user has expressed interest in official handicap sync';
COMMENT ON COLUMN public.user_profiles.handicap_sync_interest_at IS 'When user registered interest for handicap sync';