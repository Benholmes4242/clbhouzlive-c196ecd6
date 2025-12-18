-- Safe business access management RPC
-- Handles team directory + permissions atomically with safe ownership transfer

-- Drop existing functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS public.set_business_access(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.set_business_access(
  p_business_id uuid,
  p_user_profile_id uuid,
  p_access text -- 'team' | 'manager' | 'primary_manager'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_target_current_role text;
  v_current_owner_count int;
BEGIN
  v_caller_id := auth.uid();
  
  -- Get caller's role in business_members
  SELECT role INTO v_caller_role
  FROM business_members
  WHERE business_id = p_business_id AND user_profile_id = v_caller_id;
  
  -- Must be owner or admin to manage team
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: must be owner or admin';
  END IF;
  
  -- Validate access level
  IF p_access NOT IN ('team', 'manager', 'primary_manager') THEN
    RAISE EXCEPTION 'Invalid access level: %', p_access;
  END IF;
  
  -- Only owner can assign primary_manager
  IF p_access = 'primary_manager' AND v_caller_role != 'owner' THEN
    RAISE EXCEPTION 'Permission denied: only primary manager can transfer ownership';
  END IF;
  
  -- Only owner can assign manager
  IF p_access = 'manager' AND v_caller_role != 'owner' THEN
    RAISE EXCEPTION 'Permission denied: only primary manager can assign managers';
  END IF;
  
  -- Get target user's current role
  SELECT role INTO v_target_current_role
  FROM business_members
  WHERE business_id = p_business_id AND user_profile_id = p_user_profile_id;
  
  -- Handle each access level
  IF p_access = 'team' THEN
    -- Team member: in directory but no admin permissions
    -- Upsert into business_team_members
    INSERT INTO business_team_members (business_id, user_profile_id, role, created_by)
    VALUES (p_business_id, p_user_profile_id, 'staff', v_caller_id)
    ON CONFLICT (business_id, user_profile_id) 
    DO UPDATE SET role = 'staff';
    
    -- Remove from business_members if they were admin (not owner)
    IF v_target_current_role = 'admin' THEN
      DELETE FROM business_members 
      WHERE business_id = p_business_id AND user_profile_id = p_user_profile_id;
    END IF;
    
  ELSIF p_access = 'manager' THEN
    -- Manager: can edit profile, manage team (admin in business_members)
    -- Upsert into business_members as admin
    INSERT INTO business_members (business_id, user_profile_id, role)
    VALUES (p_business_id, p_user_profile_id, 'admin')
    ON CONFLICT (business_id, user_profile_id) 
    DO UPDATE SET role = 'admin';
    
    -- Ensure in team directory
    INSERT INTO business_team_members (business_id, user_profile_id, role, created_by)
    VALUES (p_business_id, p_user_profile_id, 'staff', v_caller_id)
    ON CONFLICT (business_id, user_profile_id) DO NOTHING;
    
  ELSIF p_access = 'primary_manager' THEN
    -- Ownership transfer - requires current owner
    -- Prevent if target is already owner
    IF v_target_current_role = 'owner' THEN
      RAISE EXCEPTION 'User is already primary manager';
    END IF;
    
    -- Transaction: transfer ownership
    -- 1. Set target user to owner
    INSERT INTO business_members (business_id, user_profile_id, role)
    VALUES (p_business_id, p_user_profile_id, 'owner')
    ON CONFLICT (business_id, user_profile_id) 
    DO UPDATE SET role = 'owner';
    
    -- 2. Downgrade caller from owner to admin
    UPDATE business_members 
    SET role = 'admin'
    WHERE business_id = p_business_id AND user_profile_id = v_caller_id;
    
    -- 3. Ensure both in team directory
    INSERT INTO business_team_members (business_id, user_profile_id, role, created_by)
    VALUES (p_business_id, p_user_profile_id, 'staff', v_caller_id)
    ON CONFLICT (business_id, user_profile_id) DO NOTHING;
    
  END IF;
  
  RETURN jsonb_build_object('success', true, 'access', p_access);
END;
$$;

-- Remove from team RPC (cleans up both tables)
CREATE OR REPLACE FUNCTION public.remove_from_business_team(
  p_business_id uuid,
  p_user_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_target_role text;
  v_owner_count int;
BEGIN
  v_caller_id := auth.uid();
  
  -- Get caller's role
  SELECT role INTO v_caller_role
  FROM business_members
  WHERE business_id = p_business_id AND user_profile_id = v_caller_id;
  
  -- Must be owner or admin
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: must be owner or admin';
  END IF;
  
  -- Get target's role
  SELECT role INTO v_target_role
  FROM business_members
  WHERE business_id = p_business_id AND user_profile_id = p_user_profile_id;
  
  -- Cannot remove owner (only ownership transfer possible)
  IF v_target_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove primary manager. Transfer ownership first.';
  END IF;
  
  -- Admins cannot remove other admins
  IF v_caller_role = 'admin' AND v_target_role = 'admin' THEN
    RAISE EXCEPTION 'Permission denied: only primary manager can remove managers';
  END IF;
  
  -- Cannot remove yourself
  IF p_user_profile_id = v_caller_id THEN
    RAISE EXCEPTION 'Cannot remove yourself from team';
  END IF;
  
  -- Remove from team directory
  DELETE FROM business_team_members 
  WHERE business_id = p_business_id AND user_profile_id = p_user_profile_id;
  
  -- Remove from permissions (if admin)
  DELETE FROM business_members 
  WHERE business_id = p_business_id AND user_profile_id = p_user_profile_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Get access level helper function
CREATE OR REPLACE FUNCTION public.get_business_access_level(
  p_business_id uuid,
  p_user_profile_id uuid
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM business_members
  WHERE business_id = p_business_id AND user_profile_id = p_user_profile_id;
  
  IF v_role = 'owner' THEN
    RETURN 'primary_manager';
  ELSIF v_role = 'admin' THEN
    RETURN 'manager';
  ELSE
    -- Check if in team directory
    IF EXISTS (
      SELECT 1 FROM business_team_members 
      WHERE business_id = p_business_id AND user_profile_id = p_user_profile_id
    ) THEN
      RETURN 'team';
    END IF;
    RETURN NULL;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_business_access(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_from_business_team(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_access_level(uuid, uuid) TO authenticated;