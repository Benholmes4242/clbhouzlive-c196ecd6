
-- Add top100_visible column to user_profiles table
ALTER TABLE public.user_profiles ADD COLUMN top100_visible BOOLEAN DEFAULT TRUE;

-- Add eg_visible column if it doesn't exist (referenced in the code)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS eg_visible BOOLEAN DEFAULT TRUE;
