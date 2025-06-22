
-- Add user_type enum for different account types
CREATE TYPE public.user_type AS ENUM ('individual', 'club', 'pro_shop', 'academy', 'tour_event', 'other');

-- Add business_type enum for business categories
CREATE TYPE public.business_type AS ENUM ('golf_club', 'pro_shop', 'teaching_academy', 'tour_event', 'other');

-- Add new columns to user_profiles table to support business accounts
ALTER TABLE public.user_profiles 
ADD COLUMN user_type public.user_type DEFAULT 'individual',
ADD COLUMN business_name text,
ADD COLUMN business_type public.business_type,
ADD COLUMN contact_person_name text,
ADD COLUMN phone text,
ADD COLUMN website_url text,
ADD COLUMN social_links jsonb DEFAULT '{}',
ADD COLUMN logo_url text,
ADD COLUMN cover_photo_url text,
ADD COLUMN location text;

-- Add a comment to clarify the social_links structure
COMMENT ON COLUMN public.user_profiles.social_links IS 'JSON object containing social media links like {"instagram": "url", "twitter": "url", "facebook": "url"}';
