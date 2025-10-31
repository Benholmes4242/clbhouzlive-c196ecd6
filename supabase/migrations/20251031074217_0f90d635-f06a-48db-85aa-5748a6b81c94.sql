-- Add home_club_id FK to support club joins in nearby golfers
-- Using golf_courses as the clubs table

-- Add home_club_id column if not exists
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS home_club_id uuid;

-- Add foreign key constraint to golf_courses
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS fk_user_profiles_home_club;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT fk_user_profiles_home_club
  FOREIGN KEY (home_club_id) 
  REFERENCES public.golf_courses(id) 
  ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_home_club 
  ON public.user_profiles(home_club_id);

-- Ensure golf_courses is readable by authenticated users (minimal policy)
DROP POLICY IF EXISTS golf_courses_read_auth ON public.golf_courses;

CREATE POLICY golf_courses_read_auth
  ON public.golf_courses
  FOR SELECT
  TO authenticated
  USING (true);