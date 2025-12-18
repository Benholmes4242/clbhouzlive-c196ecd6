-- Drop existing function first
DROP FUNCTION IF EXISTS public.delete_business_team_member(uuid, uuid);

-- RPC to upsert a business team member
CREATE OR REPLACE FUNCTION public.upsert_business_team_member(
  p_business_id uuid,
  p_user_profile_id uuid,
  p_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_result_id uuid;
BEGIN
  -- Get caller's role in the business
  SELECT role INTO v_caller_role
  FROM public.business_members
  WHERE business_id = p_business_id
    AND user_profile_id = auth.uid();

  -- Only owner/admin can manage team
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: must be owner or admin';
  END IF;

  -- Only owners can assign owner/admin roles
  IF p_role IN ('owner', 'admin') AND v_caller_role != 'owner' THEN
    RAISE EXCEPTION 'Permission denied: only owners can assign owner/admin roles';
  END IF;

  -- Upsert into business_team_members
  INSERT INTO public.business_team_members (business_id, user_profile_id, role, created_by)
  VALUES (p_business_id, p_user_profile_id, p_role::public.business_team_role, auth.uid())
  ON CONFLICT (business_id, user_profile_id)
  DO UPDATE SET role = p_role::public.business_team_role
  RETURNING id INTO v_result_id;

  -- If assigning owner/admin, also upsert into business_members for permissions
  IF p_role IN ('owner', 'admin') THEN
    INSERT INTO public.business_members (business_id, user_profile_id, role)
    VALUES (p_business_id, p_user_profile_id, p_role)
    ON CONFLICT (business_id, user_profile_id)
    DO UPDATE SET role = p_role;
  END IF;

  RETURN v_result_id;
END;
$$;

-- RPC to remove a business team member
CREATE FUNCTION public.delete_business_team_member(
  p_business_id uuid,
  p_user_profile_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_target_role text;
BEGIN
  -- Get caller's role in the business
  SELECT role INTO v_caller_role
  FROM public.business_members
  WHERE business_id = p_business_id
    AND user_profile_id = auth.uid();

  -- Only owner/admin can manage team
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: must be owner or admin';
  END IF;

  -- Get target's role
  SELECT role::text INTO v_target_role
  FROM public.business_team_members
  WHERE business_id = p_business_id
    AND user_profile_id = p_user_profile_id;

  -- Prevent removing owners unless you're an owner
  IF v_target_role = 'owner' AND v_caller_role != 'owner' THEN
    RAISE EXCEPTION 'Permission denied: only owners can remove owners';
  END IF;

  -- Prevent removing yourself if you're the only owner
  IF p_user_profile_id = auth.uid() AND v_target_role = 'owner' THEN
    IF (SELECT COUNT(*) FROM public.business_team_members 
        WHERE business_id = p_business_id AND role = 'owner') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last owner';
    END IF;
  END IF;

  -- Delete from business_team_members
  DELETE FROM public.business_team_members
  WHERE business_id = p_business_id
    AND user_profile_id = p_user_profile_id;

  -- Also remove from business_members if they had permissions there
  DELETE FROM public.business_members
  WHERE business_id = p_business_id
    AND user_profile_id = p_user_profile_id
    AND role NOT IN ('owner'); -- Keep owner in business_members for safety

  RETURN true;
END;
$$;

-- RPC to search users for team member selection
CREATE OR REPLACE FUNCTION public.search_users_for_team(
  p_query text,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  profile_photo_url text,
  is_verified_golfer boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.id,
    up.display_name,
    up.username,
    up.profile_photo_url,
    up.is_verified_golfer
  FROM public.user_profiles up
  WHERE (
    up.display_name ILIKE '%' || p_query || '%'
    OR up.username ILIKE '%' || p_query || '%'
  )
  ORDER BY 
    CASE WHEN up.display_name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    CASE WHEN up.username ILIKE p_query || '%' THEN 0 ELSE 1 END,
    up.display_name
  LIMIT p_limit;
$$;