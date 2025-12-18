-- Add unique constraint to prevent duplicate club entries
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_home_club
ON public.user_home_clubs (user_profile_id, club_id);