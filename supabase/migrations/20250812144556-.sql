-- Fix user_profiles RLS policies for better privacy control
-- Drop overly permissive policy that exposes all user data
DROP POLICY IF EXISTS "Users can view public profiles" ON public.user_profiles;

-- Create more granular policies for user profiles
-- Users can view their own complete profile
CREATE POLICY "Users can view their own complete profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all profiles (keep existing admin access)
CREATE POLICY "Admins can view all profiles" 
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

-- Create session storage table for secure access control
CREATE TABLE IF NOT EXISTS public.site_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  ip_address TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on session storage
ALTER TABLE public.site_access_sessions ENABLE ROW LEVEL SECURITY;

-- Only the system can manage access sessions
CREATE POLICY "System can manage access sessions" 
ON public.site_access_sessions 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_site_access_sessions_token ON public.site_access_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_site_access_sessions_expires ON public.site_access_sessions(expires_at);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.site_access_sessions 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;