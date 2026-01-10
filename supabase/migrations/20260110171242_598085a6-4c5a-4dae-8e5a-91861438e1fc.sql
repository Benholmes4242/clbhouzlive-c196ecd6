-- Add college_normalized column to user_profiles for storing individual's college affiliation
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS college_normalized TEXT NULL;

-- Create index for efficient college lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_college 
ON public.user_profiles(college_normalized)
WHERE college_normalized IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.college_normalized IS 'References college_media.normalized_name for user college affiliation';