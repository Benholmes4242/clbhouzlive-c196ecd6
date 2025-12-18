-- 1) Allow business_id to be nullable (additional clubs can exist without a business profile)
ALTER TABLE public.user_home_clubs
  ALTER COLUMN business_id DROP NOT NULL;

-- 2) Ensure club_id is required going forward
ALTER TABLE public.user_home_clubs
  ALTER COLUMN club_id SET NOT NULL;

-- 3) Drop existing index if it exists (created earlier with different definition)
DROP INDEX IF EXISTS public.uniq_user_home_club;

-- 4) Create proper unique constraint to prevent duplicate clubs per user
CREATE UNIQUE INDEX uniq_user_home_clubs_user_club
ON public.user_home_clubs(user_profile_id, club_id);