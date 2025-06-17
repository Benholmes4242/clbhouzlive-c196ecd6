
-- Add tracker_visible column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN tracker_visible boolean DEFAULT true;
