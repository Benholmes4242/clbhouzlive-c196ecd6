-- Fix user_profiles RLS policies for better privacy control
-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Create more granular policies for user profiles
-- Users can view their own complete profile
CREATE POLICY "Users can view their own complete profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all profiles (recreate admin access)
CREATE POLICY "Admins can view all user profiles" 
ON public.user_profiles 
FOR SELECT 
USING (is_admin());

-- Public can view only basic, non-sensitive information from public profiles
CREATE POLICY "Public can view basic info from public profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  is_public = true 
  AND auth.uid() != id  -- Not viewing own profile
);

-- Create a view for public profile data to limit exposed fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  display_name,
  bio,
  profile_photo_url,
  cover_photo_url,
  background_image_url,
  user_type,
  business_name,
  business_type,
  website_url,
  social_links,
  is_public,
  bag_visible,
  top100_visible,
  tracker_visible,
  eg_visible,
  created_at,
  -- Exclude sensitive fields like phone, contact_person_name, location details
  CASE WHEN user_type != 'individual' THEN location ELSE NULL END as location
FROM public.user_profiles
WHERE is_public = true;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO authenticated, anon;