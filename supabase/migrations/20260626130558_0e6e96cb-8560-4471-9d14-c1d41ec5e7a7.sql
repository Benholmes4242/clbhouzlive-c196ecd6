
-- 1.1 conversation_participants: add actor identity
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS actor_type TEXT NOT NULL DEFAULT 'personal'
    CHECK (actor_type IN ('personal','business')),
  ADD COLUMN IF NOT EXISTS actor_id UUID;

UPDATE public.conversation_participants
  SET actor_id = user_id
  WHERE actor_id IS NULL;

ALTER TABLE public.conversation_participants
  ALTER COLUMN actor_id SET NOT NULL;

ALTER TABLE public.conversation_participants
  ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_conv_participant_actor
  ON public.conversation_participants (conversation_id, actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_conv_participant_actor
  ON public.conversation_participants (actor_type, actor_id);

-- 1.2 messages: add sender actor identity
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_actor_type TEXT NOT NULL DEFAULT 'personal'
    CHECK (sender_actor_type IN ('personal','business')),
  ADD COLUMN IF NOT EXISTS sender_actor_id UUID;

UPDATE public.messages
  SET sender_actor_id = sender_id
  WHERE sender_actor_id IS NULL;

ALTER TABLE public.messages
  ALTER COLUMN sender_actor_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender_actor
  ON public.messages (sender_actor_type, sender_actor_id);
