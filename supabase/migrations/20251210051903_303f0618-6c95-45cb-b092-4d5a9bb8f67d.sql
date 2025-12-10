-- Create a security definer function to check business membership role
CREATE OR REPLACE FUNCTION public.get_user_business_role(p_user_profile_id uuid, p_business_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM business_members
  WHERE user_profile_id = p_user_profile_id
  AND business_id = p_business_id
  LIMIT 1;
$$;

-- Create a security definer function to check if user is owner of a business
CREATE OR REPLACE FUNCTION public.is_business_owner(p_user_profile_id uuid, p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE user_profile_id = p_user_profile_id
    AND business_id = p_business_id
    AND role = 'owner'
  );
$$;

-- Create a security definer function to get all businesses a user belongs to
CREATE OR REPLACE FUNCTION public.get_user_business_ids(p_user_profile_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM business_members
  WHERE user_profile_id = p_user_profile_id;
$$;

-- Drop ALL existing policies on business_members to start fresh
DROP POLICY IF EXISTS "Users can view their own memberships" ON business_members;
DROP POLICY IF EXISTS "Business members can view co-members" ON business_members;
DROP POLICY IF EXISTS "Users can create owner membership for new businesses" ON business_members;
DROP POLICY IF EXISTS "Owners can add members" ON business_members;
DROP POLICY IF EXISTS "Owners can update member roles" ON business_members;
DROP POLICY IF EXISTS "Owners can remove members" ON business_members;
DROP POLICY IF EXISTS "Business owners and admins can add members" ON business_members;
DROP POLICY IF EXISTS "Business owners and admins can view all members" ON business_members;
DROP POLICY IF EXISTS "Business owners can remove members" ON business_members;
DROP POLICY IF EXISTS "Business owners can update member roles" ON business_members;

-- Create new non-recursive policies using security definer functions
CREATE POLICY "Users can view own memberships"
ON business_members FOR SELECT
USING (user_profile_id = auth.uid());

CREATE POLICY "Users can view co-members via function"
ON business_members FOR SELECT
USING (business_id IN (SELECT public.get_user_business_ids(auth.uid())));

CREATE POLICY "Users can create first owner membership"
ON business_members FOR INSERT
WITH CHECK (user_profile_id = auth.uid() AND role = 'owner');

CREATE POLICY "Owners can insert members via function"
ON business_members FOR INSERT
WITH CHECK (public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Owners can update members via function"
ON business_members FOR UPDATE
USING (public.is_business_owner(auth.uid(), business_id));

CREATE POLICY "Owners can delete members via function"
ON business_members FOR DELETE
USING (public.is_business_owner(auth.uid(), business_id));