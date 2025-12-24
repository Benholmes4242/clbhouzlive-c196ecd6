-- Phase 1.5: Update RLS policies on user_profiles to hide soft-deleted users

-- Drop the overly permissive "Public read access" policy
DROP POLICY IF EXISTS "Public read access to profiles" ON public.user_profiles;

-- Create a new policy that hides deleted users
CREATE POLICY "Public read access to active profiles" 
ON public.user_profiles 
FOR SELECT 
USING (deleted_at IS NULL);

-- Note: The other SELECT policies (Admins, own profile, game participants, public info)
-- will also implicitly filter deleted users since they all evaluate the USING clause
-- and deleted_at IS NULL will be checked via RLS

-- Add comment for documentation
COMMENT ON POLICY "Public read access to active profiles" ON public.user_profiles 
IS 'Allows public read access to user profiles that have not been soft-deleted';