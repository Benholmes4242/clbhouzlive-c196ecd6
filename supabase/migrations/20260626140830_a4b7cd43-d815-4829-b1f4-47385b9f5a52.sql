-- Tighten conversations UPDATE policy: defence-in-depth for group metadata.
-- All real writes go through SECURITY DEFINER RPCs (update_group_info, send_message),
-- which bypass RLS. This policy guards against any direct client .update() call:
--   * For 'group' conversations: only admins can update directly.
--   * For 1:1 ('direct') conversations: any participant can update (no admin concept).
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
USING (
  CASE
    WHEN type = 'group' THEN EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
        AND cp.role = 'admin'
    )
    ELSE public.user_in_conversation(id)
  END
)
WITH CHECK (
  CASE
    WHEN type = 'group' THEN EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
        AND cp.role = 'admin'
    )
    ELSE public.user_in_conversation(id)
  END
);