-- Fix infinite recursion in creator_members RLS policies
-- The "Creator members can view their team" policy queries itself, causing infinite recursion

-- Drop the problematic recursive SELECT policy
DROP POLICY IF EXISTS "Creator members can view their team" ON creator_members;

-- The "Users can view their own memberships" policy already exists and uses direct comparison
-- (user_profile_id = auth.uid()) which doesn't cause recursion

-- For team visibility, create a SECURITY DEFINER function to break the recursion
CREATE OR REPLACE FUNCTION public.get_creator_page_ids_for_user(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT creator_page_id 
  FROM creator_members 
  WHERE user_profile_id = p_user_id;
$$;

-- Now create a non-recursive policy using the function
CREATE POLICY "Creator members can view their team"
ON creator_members
FOR SELECT
USING (
  user_profile_id = auth.uid()
  OR
  creator_page_id IN (SELECT public.get_creator_page_ids_for_user(auth.uid()))
);

-- Also fix the INSERT policy which has the same recursion issue
DROP POLICY IF EXISTS "Owners and admins can add members" ON creator_members;

CREATE OR REPLACE FUNCTION public.user_is_creator_owner_or_admin(p_user_id uuid, p_creator_page_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM creator_members 
    WHERE creator_page_id = p_creator_page_id 
    AND user_profile_id = p_user_id 
    AND role IN ('owner', 'admin')
  );
$$;

CREATE POLICY "Owners and admins can add members"
ON creator_members
FOR INSERT
WITH CHECK (
  public.user_is_creator_owner_or_admin(auth.uid(), creator_page_id)
  OR (user_profile_id = auth.uid() AND role = 'owner')
);

-- Fix UPDATE policy
DROP POLICY IF EXISTS "Owners and admins can update members" ON creator_members;

CREATE POLICY "Owners and admins can update members"
ON creator_members
FOR UPDATE
USING (
  public.user_is_creator_owner_or_admin(auth.uid(), creator_page_id)
);

-- Fix DELETE policy
DROP POLICY IF EXISTS "Owners and admins can remove members" ON creator_members;

CREATE POLICY "Owners and admins can remove members"
ON creator_members
FOR DELETE
USING (
  public.user_is_creator_owner_or_admin(auth.uid(), creator_page_id)
  OR user_profile_id = auth.uid()
);

-- Drop the redundant policy since we now have it in the main SELECT policy
DROP POLICY IF EXISTS "Users can view their own memberships" ON creator_members;