-- Create table to store mock profile clones
-- These are copies of real user profiles used for mock/testing purposes
-- They have no connection to real user profiles and can be toggled on/off

CREATE TABLE IF NOT EXISTS public.mock_profile_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Core profile fields (cloned from user_profiles)
  display_name text,
  username text,
  profile_photo_url text,
  bio text,
  home_club text,
  profile_video_url text,
  profile_video_thumbnail_url text,
  header_photo_url text,
  background_image_url text,
  
  -- Additional metadata
  followers_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  
  -- Tracking
  cloned_from_user_id uuid, -- Reference to original user (for tracking only, not a foreign key)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mock_profile_clones ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read mock profiles (they're for display purposes only)
CREATE POLICY "Anyone can read mock profile clones"
  ON public.mock_profile_clones
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete mock profiles
-- For now, we'll allow insert for seeding purposes
CREATE POLICY "Allow insert mock profile clones"
  ON public.mock_profile_clones
  FOR INSERT
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_mock_profile_clones_updated_at
  BEFORE UPDATE ON public.mock_profile_clones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clone real profiles into mock profiles
CREATE OR REPLACE FUNCTION public.clone_real_profiles_to_mock(limit_count integer DEFAULT 20)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cloned_count integer := 0;
BEGIN
  -- Clear existing mock profiles
  DELETE FROM public.mock_profile_clones;
  
  -- Clone random real profiles
  INSERT INTO public.mock_profile_clones (
    display_name,
    username,
    profile_photo_url,
    bio,
    home_club,
    profile_video_url,
    profile_video_thumbnail_url,
    header_photo_url,
    background_image_url,
    followers_count,
    is_verified,
    cloned_from_user_id
  )
  SELECT 
    up.display_name,
    up.username,
    up.profile_photo_url,
    up.bio,
    up.home_club,
    up.profile_video_url,
    up.profile_video_thumbnail_url,
    up.header_photo_url,
    up.background_image_url,
    COALESCE((
      SELECT COUNT(*)::integer 
      FROM user_follows 
      WHERE following_id = up.id
    ), 0) as followers_count,
    false as is_verified,
    up.id as cloned_from_user_id
  FROM public.user_profiles up
  WHERE up.is_public = true
    AND up.profile_photo_url IS NOT NULL
    AND up.display_name IS NOT NULL
  ORDER BY RANDOM()
  LIMIT limit_count;
  
  GET DIAGNOSTICS cloned_count = ROW_COUNT;
  
  RETURN cloned_count;
END;
$$;

COMMENT ON FUNCTION public.clone_real_profiles_to_mock IS 'Clones real user profiles into mock_profile_clones table for testing purposes. These clones have no connection to the original profiles.';

-- Seed initial mock profiles from real data
SELECT public.clone_real_profiles_to_mock(20);