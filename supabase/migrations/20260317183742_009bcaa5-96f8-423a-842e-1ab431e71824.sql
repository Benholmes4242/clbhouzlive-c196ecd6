-- Drop the recursive policy
DROP POLICY IF EXISTS "username_immutable" ON public.user_profiles;

-- Create a security definer function to safely read the current username
CREATE OR REPLACE FUNCTION public.get_current_username(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM public.user_profiles WHERE id = _user_id;
$$;

-- Re-create the policy using the safe function
CREATE POLICY "username_immutable" ON public.user_profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (
    username = public.get_current_username(auth.uid())
    OR public.get_current_username(auth.uid()) IS NULL
  );