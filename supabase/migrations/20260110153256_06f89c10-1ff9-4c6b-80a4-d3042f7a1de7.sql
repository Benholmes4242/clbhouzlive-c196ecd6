-- Echo Conversations table
CREATE TABLE IF NOT EXISTS public.echo_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  summary text,
  pinned boolean NOT NULL DEFAULT false,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Echo Messages table (new, not to be confused with existing echo_messages)
CREATE TABLE IF NOT EXISTS public.echo_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.echo_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_echo_conversations_user_last
  ON public.echo_conversations(user_id, pinned DESC, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_echo_conv_messages_conversation_created
  ON public.echo_conversation_messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_echo_conv_messages_user_created
  ON public.echo_conversation_messages(user_id, created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_echo_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_echo_conversations_updated_at ON public.echo_conversations;
CREATE TRIGGER trg_echo_conversations_updated_at
BEFORE UPDATE ON public.echo_conversations
FOR EACH ROW EXECUTE FUNCTION public.set_echo_updated_at();

-- Enable RLS
ALTER TABLE public.echo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_conversation_messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
CREATE POLICY echo_conversations_select ON public.echo_conversations
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY echo_conversations_insert ON public.echo_conversations
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY echo_conversations_update ON public.echo_conversations
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY echo_conversations_delete ON public.echo_conversations
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Messages RLS
CREATE POLICY echo_conv_messages_select ON public.echo_conversation_messages
FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.echo_conversations c
    WHERE c.id = echo_conversation_messages.conversation_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY echo_conv_messages_insert ON public.echo_conversation_messages
FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.echo_conversations c
    WHERE c.id = echo_conversation_messages.conversation_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY echo_conv_messages_delete ON public.echo_conversation_messages
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 30-day auto-purge function
CREATE OR REPLACE FUNCTION public.echo_purge_old_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Delete messages older than 30 days
  DELETE FROM public.echo_conversation_messages
  WHERE created_at < now() - interval '30 days';

  -- Delete conversations with no messages left (or last activity > 30 days)
  DELETE FROM public.echo_conversations
  WHERE last_message_at < now() - interval '30 days';
END;
$$;