-- ============================================
-- MESSAGING POLISH: New Tables for Blocks, Reports, Saved Messages
-- ============================================

-- 1. User Blocks Table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- RLS for user_blocks
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" 
  ON public.user_blocks FOR SELECT 
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can insert own blocks" 
  ON public.user_blocks FOR INSERT 
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can delete own blocks" 
  ON public.user_blocks FOR DELETE 
  USING (blocker_id = auth.uid());

-- 2. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  reported_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports" 
  ON public.reports FOR INSERT 
  WITH CHECK (reporter_id = auth.uid());

-- 3. Saved Messages (Caddie's Picks) Table
CREATE TABLE IF NOT EXISTS public.saved_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- RLS for saved_messages
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved messages" 
  ON public.saved_messages FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved messages" 
  ON public.saved_messages FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saved messages" 
  ON public.saved_messages FOR DELETE 
  USING (user_id = auth.uid());

-- 4. Helper function: Check if a user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(p_blocker_id UUID, p_blocked_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id
  )
$$;

-- 5. Helper function: Block a user
CREATE OR REPLACE FUNCTION public.block_user(p_blocked_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert block record
  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  VALUES (auth.uid(), p_blocked_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  
  -- Archive any conversations with this user
  UPDATE public.conversation_participants
  SET is_archived = true, archived_at = NOW()
  WHERE user_id = auth.uid()
    AND conversation_id IN (
      SELECT cp.conversation_id 
      FROM public.conversation_participants cp
      WHERE cp.user_id = p_blocked_id
    );
END;
$$;

-- 6. Helper function: Unblock a user
CREATE OR REPLACE FUNCTION public.unblock_user(p_blocked_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_blocks
  WHERE blocker_id = auth.uid() AND blocked_id = p_blocked_id;
END;
$$;

-- 7. Helper function: Submit a report
CREATE OR REPLACE FUNCTION public.submit_report(
  p_reported_user_id UUID DEFAULT NULL,
  p_reported_conversation_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'other',
  p_details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id UUID;
BEGIN
  INSERT INTO public.reports (reporter_id, reported_user_id, reported_conversation_id, reason, details)
  VALUES (auth.uid(), p_reported_user_id, p_reported_conversation_id, p_reason, p_details)
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$;

-- 8. Helper function: Toggle saved message (Caddie's Pick)
CREATE OR REPLACE FUNCTION public.toggle_saved_message(p_message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if already saved
  SELECT EXISTS (
    SELECT 1 FROM public.saved_messages
    WHERE user_id = auth.uid() AND message_id = p_message_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove from saved
    DELETE FROM public.saved_messages
    WHERE user_id = auth.uid() AND message_id = p_message_id;
    RETURN false; -- Now unsaved
  ELSE
    -- Add to saved
    INSERT INTO public.saved_messages (user_id, message_id)
    VALUES (auth.uid(), p_message_id);
    RETURN true; -- Now saved
  END IF;
END;
$$;

-- 9. Helper function: Check if message is saved
CREATE OR REPLACE FUNCTION public.is_message_saved(p_message_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.saved_messages
    WHERE user_id = auth.uid() AND message_id = p_message_id
  )
$$;

-- 10. Update delivery status function
CREATE OR REPLACE FUNCTION public.update_message_delivery_status(
  p_message_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET delivery_status = p_status
  WHERE id = p_message_id;
END;
$$;

-- 11. Mark messages as read (update delivery_status to 'read')
CREATE OR REPLACE FUNCTION public.mark_messages_read_in_conversation(p_conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update delivery_status to 'read' for all unread messages not sent by current user
  UPDATE public.messages
  SET delivery_status = 'read',
      read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND (delivery_status IS NULL OR delivery_status != 'read');
    
  -- Also update the participant's last_read_at
  UPDATE public.conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
END;
$$;

-- 12. Add delivery_status and read_at columns to messages if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN delivery_status TEXT DEFAULT 'sent';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
  END IF;
END
$$;