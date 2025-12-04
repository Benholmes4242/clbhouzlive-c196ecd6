
-- Phase 2: Auth & Onboarding Setup
-- =================================

-- 1. Add has_completed_onboarding column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- 2. Backfill existing users to mark them as onboarded (don't force legacy users through onboarding)
UPDATE public.user_profiles 
SET has_completed_onboarding = true 
WHERE has_completed_onboarding IS NULL OR has_completed_onboarding = false;

-- 3. Create a trigger function to auto-create user_profiles on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  username_val TEXT;
  display_name_val TEXT;
BEGIN
  -- Extract username from user metadata (set during signup) or generate from email
  username_val := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Extract display name from metadata or default to username
  display_name_val := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    username_val
  );
  
  -- Insert new profile with default values
  INSERT INTO public.user_profiles (
    id,
    username,
    display_name,
    user_type,
    is_public,
    has_completed_onboarding
  )
  VALUES (
    NEW.id,
    username_val,
    display_name_val,
    'individual',  -- Default to personal golfer
    true,          -- Public by default
    false          -- Needs to complete onboarding
  )
  ON CONFLICT (id) DO NOTHING;  -- Don't overwrite if profile already exists
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger on auth.users to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Add index for onboarding check queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
ON public.user_profiles(id, has_completed_onboarding);

-- 6. Add comment for documentation
COMMENT ON COLUMN public.user_profiles.has_completed_onboarding IS 'Whether user has completed account type selection onboarding';
COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates user_profiles row when new auth user signs up';
