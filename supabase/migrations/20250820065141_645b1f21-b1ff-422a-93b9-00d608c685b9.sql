-- Add header_photo_url column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS header_photo_url TEXT;