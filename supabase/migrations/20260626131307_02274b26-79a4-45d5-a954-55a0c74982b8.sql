
-- ============================================================
-- Helpers
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_manages_business(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = p_business_id
      AND bm.user_profile_id = auth.uid()
      AND bm.role IN ('owner','admin','editor')
  );
$$;

-- Returns true if auth.uid() is in the conversation either as themselves
-- (personal participant) or via a business they manage (business participant).
CREATE OR REPLACE FUNCTION public.user_in_conversation(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND (
        (cp.actor_type = 'personal' AND cp.user_id = auth.uid())
        OR
        (cp.actor_type = 'business' AND public.user_manages_business(cp.actor_id))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_manages_business(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_in_conversation(uuid) TO authenticated, anon;

-- ============================================================
-- conversations
-- ============================================================

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING ( public.user_in_conversation(conversations.id) );

-- Allow updates from any participant actor (read receipts / last_message_*).
-- Admin-only group settings are enforced in app code; this keeps the
-- previous practical behaviour while supporting business participants.
CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING ( public.user_in_conversation(conversations.id) )
WITH CHECK ( public.user_in_conversation(conversations.id) );

-- ============================================================
-- conversation_participants
-- ============================================================

DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;

CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  -- See your own actor row...
  (actor_type = 'personal' AND user_id = auth.uid())
  OR (actor_type = 'business' AND public.user_manages_business(actor_id))
  -- ...and see co-participants in any conversation you're in.
  OR public.user_in_conversation(conversation_id)
);

CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- The added actor must be one the caller is entitled to add directly:
  -- themselves personally, or a business they manage.
  (
    (actor_type = 'personal' AND user_id = auth.uid())
    OR (actor_type = 'business' AND public.user_manages_business(actor_id))
  )
);

CREATE POLICY "Users can update their own participant record"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (
  (actor_type = 'personal' AND user_id = auth.uid())
  OR (actor_type = 'business' AND public.user_manages_business(actor_id))
)
WITH CHECK (
  (actor_type = 'personal' AND user_id = auth.uid())
  OR (actor_type = 'business' AND public.user_manages_business(actor_id))
);

CREATE POLICY "Users can leave conversations"
ON public.conversation_participants
FOR DELETE
TO authenticated
USING (
  (actor_type = 'personal' AND user_id = auth.uid())
  OR (actor_type = 'business' AND public.user_manages_business(actor_id))
);

-- ============================================================
-- messages
-- ============================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING ( public.user_in_conversation(messages.conversation_id) );

-- Critical impersonation guard: caller is the human sender AND the displayed
-- actor must be either the caller personally or a business they manage.
CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.user_in_conversation(messages.conversation_id)
  AND (
    (sender_actor_type = 'personal' AND sender_actor_id = auth.uid())
    OR (sender_actor_type = 'business' AND public.user_manages_business(sender_actor_id))
  )
);

CREATE POLICY "Users can edit their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING ( sender_id = auth.uid() )
WITH CHECK ( sender_id = auth.uid() );

CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING ( sender_id = auth.uid() );

-- ============================================================
-- RPCs
-- ============================================================

-- Preserve legacy 1-arg signature: personal-to-personal DM as caller.
CREATE OR REPLACE FUNCTION public.get_or_create_dm_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_or_create_dm_conversation(
    p_target_actor_type := 'personal',
    p_target_actor_id   := other_user_id,
    p_caller_actor_type := 'personal',
    p_caller_actor_id   := auth.uid()
  );
END;
$$;

-- Actor-aware variant.
-- Caller actor: 'personal' (must be auth.uid()) OR 'business' (must be managed by auth.uid()).
-- Target actor: 'personal' user OR 'business'. Anyone can DM a business (D2).
CREATE OR REPLACE FUNCTION public.get_or_create_dm_conversation(
  p_target_actor_type text,
  p_target_actor_id   uuid,
  p_caller_actor_type text DEFAULT 'personal',
  p_caller_actor_id   uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_uid uuid := auth.uid();
  v_caller_actor_id uuid := COALESCE(p_caller_actor_id, v_caller_uid);
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  IF v_caller_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_target_actor_type NOT IN ('personal','business') THEN
    RAISE EXCEPTION 'Invalid target actor type: %', p_target_actor_type;
  END IF;
  IF p_caller_actor_type NOT IN ('personal','business') THEN
    RAISE EXCEPTION 'Invalid caller actor type: %', p_caller_actor_type;
  END IF;

  -- Validate caller actor (no impersonation)
  IF p_caller_actor_type = 'personal' THEN
    IF v_caller_actor_id <> v_caller_uid THEN
      RAISE EXCEPTION 'Personal caller actor must be self';
    END IF;
  ELSE
    IF NOT public.user_manages_business(v_caller_actor_id) THEN
      RAISE EXCEPTION 'Caller does not manage business %', v_caller_actor_id;
    END IF;
  END IF;

  -- No DM-to-self
  IF p_target_actor_type = p_caller_actor_type
     AND p_target_actor_id = v_caller_actor_id THEN
    RAISE EXCEPTION 'Cannot DM yourself';
  END IF;

  -- Look up an existing direct conversation between these two actors
  SELECT cp1.conversation_id INTO v_existing_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 ON cp2.conversation_id = cp1.conversation_id
  JOIN public.conversations c ON c.id = cp1.conversation_id
  WHERE c.type = 'direct'
    AND cp1.actor_type = p_caller_actor_type AND cp1.actor_id = v_caller_actor_id
    AND cp2.actor_type = p_target_actor_type AND cp2.actor_id = p_target_actor_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (type, created_by)
  VALUES ('direct', v_caller_uid)
  RETURNING id INTO v_new_id;

  -- Caller participant
  INSERT INTO public.conversation_participants
    (conversation_id, user_id, actor_type, actor_id, role)
  VALUES (
    v_new_id,
    CASE WHEN p_caller_actor_type = 'personal' THEN v_caller_uid ELSE NULL END,
    p_caller_actor_type,
    v_caller_actor_id,
    'admin'
  );

  -- Target participant (D2: anyone can DM a business; business row has user_id NULL)
  INSERT INTO public.conversation_participants
    (conversation_id, user_id, actor_type, actor_id, role)
  VALUES (
    v_new_id,
    CASE WHEN p_target_actor_type = 'personal' THEN p_target_actor_id ELSE NULL END,
    p_target_actor_type,
    p_target_actor_id,
    'member'
  );

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_dm_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_dm_conversation(text, uuid, text, uuid) TO authenticated;

-- Actor-aware mark-read: marks the caller's active participant row.
-- Defaults to personal (back-compat). Business path validates management.
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
  p_conversation_id uuid,
  p_actor_type text DEFAULT 'personal',
  p_actor_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_actor_id uuid := COALESCE(p_actor_id, v_uid);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_actor_type = 'personal' THEN
    IF v_actor_id <> v_uid THEN
      RAISE EXCEPTION 'Personal actor must be self';
    END IF;
  ELSIF p_actor_type = 'business' THEN
    IF NOT public.user_manages_business(v_actor_id) THEN
      RAISE EXCEPTION 'Caller does not manage business %', v_actor_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid actor type: %', p_actor_type;
  END IF;

  UPDATE public.conversation_participants
     SET last_read_at = NOW()
   WHERE conversation_id = p_conversation_id
     AND actor_type = p_actor_type
     AND actor_id   = v_actor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid, text, uuid) TO authenticated;
