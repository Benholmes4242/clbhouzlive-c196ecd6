-- Add profile video fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN profile_video_url text,
ADD COLUMN profile_video_thumbnail_url text,
ADD COLUMN has_profile_video boolean DEFAULT false,
ADD COLUMN profile_video_visibility text DEFAULT 'public' CHECK (profile_video_visibility IN ('public', 'friends', 'private'));