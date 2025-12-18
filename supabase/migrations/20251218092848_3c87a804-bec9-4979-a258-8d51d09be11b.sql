-- Add visibility columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS home_club_visibility text NOT NULL DEFAULT 'public',
ADD COLUMN IF NOT EXISTS additional_clubs_visibility text NOT NULL DEFAULT 'followers';

-- Add check constraints
ALTER TABLE public.user_profiles
ADD CONSTRAINT home_club_visibility_check
CHECK (home_club_visibility IN ('public','followers','friends','private'));

ALTER TABLE public.user_profiles
ADD CONSTRAINT additional_clubs_visibility_check
CHECK (additional_clubs_visibility IN ('public','followers','friends','private'));