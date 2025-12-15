-- Phase 3.1: Add is_creator flag to user_profiles for Creator Mode
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_creator boolean NOT NULL DEFAULT false;

-- Add index for efficient creator queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_creator 
ON public.user_profiles(is_creator) 
WHERE is_creator = true;

-- Comment for documentation
COMMENT ON COLUMN public.user_profiles.is_creator IS 'Enables Creator Mode - unlocks featured video, pin content, creator analytics';