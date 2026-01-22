-- Add missing columns to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_settings JSONB DEFAULT '{}';

-- Add archived_at timestamp to conversation_participants  
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create index for faster archive queries
CREATE INDEX IF NOT EXISTS idx_conversation_participants_archived 
ON conversation_participants(user_id, is_archived) 
WHERE is_archived = true;

-- Update existing group creators to have 'admin' role
UPDATE conversation_participants cp
SET role = 'admin'
FROM conversations c
WHERE cp.conversation_id = c.id 
  AND cp.user_id = c.created_by
  AND c.type = 'group'
  AND cp.role = 'member';

-- Update group info (name, avatar, description)
CREATE OR REPLACE FUNCTION update_group_info(
  p_conversation_id UUID,
  p_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_user_role
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update group info';
  END IF;
  
  -- Update group
  UPDATE conversations
  SET 
    name = COALESCE(p_name, name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    description = COALESCE(p_description, description),
    updated_at = NOW()
  WHERE id = p_conversation_id
    AND type = 'group';
    
  RETURN FOUND;
END;
$$;

-- Add members to group
CREATE OR REPLACE FUNCTION add_group_members(
  p_conversation_id UUID,
  p_user_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_added_count INTEGER := 0;
  v_user_id UUID;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_user_role
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can add members';
  END IF;
  
  -- Add each user
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (p_conversation_id, v_user_id, 'member')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    IF FOUND THEN
      v_added_count := v_added_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_added_count;
END;
$$;

-- Remove member from group
CREATE OR REPLACE FUNCTION remove_group_member(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_target_role TEXT;
  v_creator_id UUID;
BEGIN
  -- Get conversation creator
  SELECT created_by INTO v_creator_id
  FROM conversations
  WHERE id = p_conversation_id;
  
  -- Cannot remove the creator
  IF p_user_id = v_creator_id THEN
    RAISE EXCEPTION 'Cannot remove the group creator';
  END IF;
  
  -- Check if current user is admin (or removing themselves)
  SELECT role INTO v_user_role
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  IF v_user_role != 'admin' AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Only admins can remove members';
  END IF;
  
  -- Remove the member
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
    
  RETURN FOUND;
END;
$$;

-- Update member role (make/remove admin)
CREATE OR REPLACE FUNCTION update_member_role(
  p_conversation_id UUID,
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_creator_id UUID;
BEGIN
  -- Validate role
  IF p_new_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or member';
  END IF;
  
  -- Get conversation creator
  SELECT created_by INTO v_creator_id
  FROM conversations
  WHERE id = p_conversation_id;
  
  -- Cannot change creator's role
  IF p_user_id = v_creator_id THEN
    RAISE EXCEPTION 'Cannot change the group creator role';
  END IF;
  
  -- Check if current user is admin
  SELECT role INTO v_user_role
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change member roles';
  END IF;
  
  -- Update role
  UPDATE conversation_participants
  SET role = p_new_role
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
    
  RETURN FOUND;
END;
$$;

-- Archive/unarchive conversation
CREATE OR REPLACE FUNCTION toggle_conversation_archive(
  p_conversation_id UUID,
  p_archive BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversation_participants
  SET 
    is_archived = p_archive,
    archived_at = CASE WHEN p_archive THEN NOW() ELSE NULL END
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  RETURN FOUND;
END;
$$;

-- Leave group
CREATE OR REPLACE FUNCTION leave_group(
  p_conversation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_admin_count INTEGER;
BEGIN
  -- Get conversation creator
  SELECT created_by INTO v_creator_id
  FROM conversations
  WHERE id = p_conversation_id;
  
  -- Creator cannot leave, must transfer ownership or delete group
  IF auth.uid() = v_creator_id THEN
    RAISE EXCEPTION 'Group creator cannot leave. Transfer ownership first or delete the group.';
  END IF;
  
  -- Remove user from group
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  RETURN FOUND;
END;
$$;