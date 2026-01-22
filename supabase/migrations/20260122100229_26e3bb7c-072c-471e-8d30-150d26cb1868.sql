-- Add deleted_at and deleted_by columns to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Function to add system message
CREATE OR REPLACE FUNCTION add_system_message(
  p_conversation_id UUID,
  p_event_type TEXT,
  p_user_id UUID,
  p_user_name TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_content TEXT;
BEGIN
  -- Generate human-readable content based on event type
  CASE p_event_type
    WHEN 'user_added' THEN
      v_content := p_user_name || ' has been added';
    WHEN 'user_left' THEN
      v_content := p_user_name || ' left the group';
    WHEN 'user_ejected' THEN
      v_content := p_user_name || ' has been ejected';
    WHEN 'admin_promoted' THEN
      v_content := p_user_name || ' is now a group admin';
    WHEN 'admin_demoted' THEN
      v_content := p_user_name || ' is no longer an admin';
    WHEN 'group_created' THEN
      v_content := p_actor_name || ' created this group';
    WHEN 'name_changed' THEN
      v_content := p_actor_name || ' changed the group name';
    WHEN 'photo_changed' THEN
      v_content := p_actor_name || ' changed the group photo';
    ELSE
      v_content := 'Group updated';
  END CASE;

  -- Insert system message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type,
    media_metadata
  ) VALUES (
    p_conversation_id,
    NULL,
    v_content,
    'system',
    jsonb_build_object(
      'event_type', p_event_type,
      'user_id', p_user_id,
      'user_name', p_user_name,
      'actor_id', p_actor_id,
      'actor_name', p_actor_name
    )
  )
  RETURNING id INTO v_message_id;

  -- Update conversation last message
  UPDATE conversations
  SET 
    last_message_at = NOW(),
    last_message_preview = v_content
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$;


-- Updated: Add members to group (with system messages)
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
  v_user_name TEXT;
  v_actor_name TEXT;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_user_role
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can add members';
  END IF;

  -- Get actor name
  SELECT COALESCE(display_name, username) INTO v_actor_name
  FROM public_profiles WHERE id = auth.uid();
  
  -- Add each user
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (p_conversation_id, v_user_id, 'member')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    IF FOUND THEN
      v_added_count := v_added_count + 1;
      
      -- Get user name and add system message
      SELECT COALESCE(display_name, username) INTO v_user_name
      FROM public_profiles WHERE id = v_user_id;
      
      PERFORM add_system_message(
        p_conversation_id,
        'user_added',
        v_user_id,
        v_user_name,
        auth.uid(),
        v_actor_name
      );
    END IF;
  END LOOP;
  
  RETURN v_added_count;
END;
$$;


-- Updated: Remove member from group (with system message)
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
  v_user_name TEXT;
  v_actor_name TEXT;
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

  -- Get names for system message
  SELECT COALESCE(display_name, username) INTO v_user_name
  FROM public_profiles WHERE id = p_user_id;
  
  SELECT COALESCE(display_name, username) INTO v_actor_name
  FROM public_profiles WHERE id = auth.uid();
  
  -- Remove the member
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  IF FOUND THEN
    -- Add system message (ejected)
    PERFORM add_system_message(
      p_conversation_id,
      'user_ejected',
      p_user_id,
      v_user_name,
      auth.uid(),
      v_actor_name
    );
  END IF;
    
  RETURN FOUND;
END;
$$;


-- Updated: Leave group (with system message and admin transfer)
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
  v_is_admin BOOLEAN;
  v_admin_count INTEGER;
  v_member_count INTEGER;
  v_new_admin_id UUID;
  v_user_name TEXT;
  v_new_admin_name TEXT;
BEGIN
  -- Get conversation creator and check if user is admin
  SELECT c.created_by, cp.role = 'admin'
  INTO v_creator_id, v_is_admin
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = auth.uid()
  WHERE c.id = p_conversation_id;
  
  -- Get user name
  SELECT COALESCE(display_name, username) INTO v_user_name
  FROM public_profiles WHERE id = auth.uid();

  -- Count remaining admins and members
  SELECT 
    COUNT(*) FILTER (WHERE role = 'admin' AND user_id != auth.uid()),
    COUNT(*) FILTER (WHERE user_id != auth.uid())
  INTO v_admin_count, v_member_count
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id;

  -- If user is admin/creator and no other admins, promote someone
  IF v_is_admin AND v_admin_count = 0 AND v_member_count > 0 THEN
    -- Find the longest-standing member to promote
    SELECT user_id INTO v_new_admin_id
    FROM conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id != auth.uid()
    ORDER BY joined_at ASC
    LIMIT 1;
    
    IF v_new_admin_id IS NOT NULL THEN
      -- Promote to admin
      UPDATE conversation_participants
      SET role = 'admin'
      WHERE conversation_id = p_conversation_id
        AND user_id = v_new_admin_id;
      
      -- Update creator if leaving user was creator
      IF auth.uid() = v_creator_id THEN
        UPDATE conversations
        SET created_by = v_new_admin_id
        WHERE id = p_conversation_id;
      END IF;
      
      -- Get new admin name and add system message
      SELECT COALESCE(display_name, username) INTO v_new_admin_name
      FROM public_profiles WHERE id = v_new_admin_id;
      
      PERFORM add_system_message(
        p_conversation_id,
        'admin_promoted',
        v_new_admin_id,
        v_new_admin_name,
        auth.uid(),
        v_user_name
      );
    END IF;
  END IF;

  -- Remove user from group
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
  
  IF FOUND THEN
    -- Add system message
    PERFORM add_system_message(
      p_conversation_id,
      'user_left',
      auth.uid(),
      v_user_name,
      NULL,
      NULL
    );
  END IF;
    
  RETURN FOUND;
END;
$$;


-- Updated: Update member role (with system message)
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
  v_user_name TEXT;
  v_actor_name TEXT;
  v_event_type TEXT;
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
  
  -- Get names for system message
  SELECT COALESCE(display_name, username) INTO v_user_name
  FROM public_profiles WHERE id = p_user_id;
  
  SELECT COALESCE(display_name, username) INTO v_actor_name
  FROM public_profiles WHERE id = auth.uid();
  
  -- Update role
  UPDATE conversation_participants
  SET role = p_new_role
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  IF FOUND THEN
    -- Add system message
    v_event_type := CASE WHEN p_new_role = 'admin' THEN 'admin_promoted' ELSE 'admin_demoted' END;
    
    PERFORM add_system_message(
      p_conversation_id,
      v_event_type,
      p_user_id,
      v_user_name,
      auth.uid(),
      v_actor_name
    );
  END IF;
    
  RETURN FOUND;
END;
$$;


-- New: Delete group (admin only - removes for everyone)
CREATE OR REPLACE FUNCTION delete_group(
  p_conversation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_is_group BOOLEAN;
BEGIN
  -- Check if it's a group conversation
  SELECT type = 'group' INTO v_is_group
  FROM conversations
  WHERE id = p_conversation_id;
  
  IF NOT v_is_group THEN
    RAISE EXCEPTION 'Can only delete group conversations with this function';
  END IF;

  -- Check if user is admin
  SELECT role INTO v_user_role
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete the group';
  END IF;
  
  -- Soft delete - mark as deleted
  UPDATE conversations
  SET 
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE id = p_conversation_id;
  
  -- Remove all participants
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id;
  
  RETURN FOUND;
END;
$$;


-- Updated: Update group info (with system messages)
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
  v_actor_name TEXT;
  v_old_name TEXT;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_user_role
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update group info';
  END IF;
  
  -- Get actor name and old group name
  SELECT COALESCE(display_name, username) INTO v_actor_name
  FROM public_profiles WHERE id = auth.uid();
  
  SELECT name INTO v_old_name
  FROM conversations WHERE id = p_conversation_id;
  
  -- Update group
  UPDATE conversations
  SET 
    name = COALESCE(p_name, name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    description = COALESCE(p_description, description),
    updated_at = NOW()
  WHERE id = p_conversation_id
    AND type = 'group';
  
  -- Add system messages for changes
  IF p_name IS NOT NULL AND p_name != v_old_name THEN
    PERFORM add_system_message(
      p_conversation_id,
      'name_changed',
      auth.uid(),
      v_actor_name,
      auth.uid(),
      v_actor_name
    );
  END IF;
  
  IF p_avatar_url IS NOT NULL THEN
    PERFORM add_system_message(
      p_conversation_id,
      'photo_changed',
      auth.uid(),
      v_actor_name,
      auth.uid(),
      v_actor_name
    );
  END IF;
    
  RETURN FOUND;
END;
$$;