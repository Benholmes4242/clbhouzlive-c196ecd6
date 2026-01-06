-- =====================================================
-- HUB MESSAGES SYSTEM TABLES
-- Tables for messaging between users (backend-ready, v1 is mock data)
-- =====================================================

-- Conversations table (group or direct chats)
CREATE TABLE public.hub_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT, -- Optional title for group conversations
  conversation_type TEXT NOT NULL DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group', 'game'))
);

-- Conversation members (who is in each conversation)
CREATE TABLE public.hub_conversation_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.hub_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Messages within conversations
CREATE TABLE public.hub_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.hub_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.hub_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hub_conversations
-- Users can view conversations they are members of
CREATE POLICY "Users can view conversations they belong to"
ON public.hub_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hub_conversation_members
    WHERE hub_conversation_members.conversation_id = hub_conversations.id
    AND hub_conversation_members.user_id = auth.uid()
  )
);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
ON public.hub_conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for hub_conversation_members
-- Users can view members of conversations they belong to
CREATE POLICY "Users can view conversation members"
ON public.hub_conversation_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hub_conversation_members AS cm
    WHERE cm.conversation_id = hub_conversation_members.conversation_id
    AND cm.user_id = auth.uid()
  )
);

-- Users can add themselves to conversations
CREATE POLICY "Users can join conversations"
ON public.hub_conversation_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own membership (last_read_at)
CREATE POLICY "Users can update their membership"
ON public.hub_conversation_members
FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for hub_messages
-- Users can view messages in conversations they belong to
CREATE POLICY "Users can view messages in their conversations"
ON public.hub_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hub_conversation_members
    WHERE hub_conversation_members.conversation_id = hub_messages.conversation_id
    AND hub_conversation_members.user_id = auth.uid()
  )
);

-- Users can send messages to conversations they belong to
CREATE POLICY "Users can send messages to their conversations"
ON public.hub_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.hub_conversation_members
    WHERE hub_conversation_members.conversation_id = hub_messages.conversation_id
    AND hub_conversation_members.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_hub_conversation_members_user ON public.hub_conversation_members(user_id);
CREATE INDEX idx_hub_conversation_members_conversation ON public.hub_conversation_members(conversation_id);
CREATE INDEX idx_hub_messages_conversation ON public.hub_messages(conversation_id);
CREATE INDEX idx_hub_messages_sender ON public.hub_messages(sender_id);
CREATE INDEX idx_hub_messages_created ON public.hub_messages(created_at DESC);

-- Trigger to update conversation updated_at when messages are added
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.hub_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.hub_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();