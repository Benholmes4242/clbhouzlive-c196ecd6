
-- Phase 1: Profiles / Follows / Friends Database Setup
-- =====================================================

-- 1. Extend user_type enum with additional values
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'brand';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'creator';
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'personal';

-- 2. Add home_club_id as FK to golf_courses (linking to actual course)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS home_club_id UUID REFERENCES public.golf_courses(id) ON DELETE SET NULL;

-- 3. Add is_official_club boolean for verified club accounts
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_official_club BOOLEAN DEFAULT false;

-- 4. Add indexes on user_friends for faster queries
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON public.user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON public.user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON public.user_friends(status);

-- 5. Update RLS policies for user_follows
-- Allow all authenticated users to view follow relationships (for follower/following counts)
DROP POLICY IF EXISTS "Users can view their follow relationships" ON public.user_follows;
CREATE POLICY "Authenticated users can view all follow relationships"
ON public.user_follows FOR SELECT
TO authenticated
USING (true);

-- 6. Update RLS policies for user_friends  
-- Allow all authenticated users to view friendships (for friend counts/lists)
DROP POLICY IF EXISTS "Users can view their friend relationships" ON public.user_friends;
CREATE POLICY "Authenticated users can view all friend relationships"
ON public.user_friends FOR SELECT
TO authenticated
USING (true);

-- 7. Ensure all existing profiles have a user_type set
UPDATE public.user_profiles 
SET user_type = 'individual' 
WHERE user_type IS NULL;

-- 8. Add comment for documentation
COMMENT ON COLUMN public.user_profiles.user_type IS 'Profile type: individual (personal golfer), club, pro_shop, academy, tour_event, brand, creator, other';
COMMENT ON COLUMN public.user_profiles.home_club_id IS 'FK to golf_courses for personal profiles home club';
COMMENT ON COLUMN public.user_profiles.is_official_club IS 'Whether this club profile is officially verified';
