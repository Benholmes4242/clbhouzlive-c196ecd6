-- Add is_test column to user_profiles to hide test users from normal discovery
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_test ON public.user_profiles(is_test) WHERE is_test = false;

-- Comment for documentation
COMMENT ON COLUMN public.user_profiles.is_test IS 'Flag to mark test/admin-only accounts that should be hidden from normal user discovery';