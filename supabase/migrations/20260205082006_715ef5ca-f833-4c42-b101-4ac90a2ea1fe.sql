-- ============================================
-- PHASE 1: Clean separation of messaging and notifications
-- Messages belong in the messaging system ONLY.
-- Notifications/activity is for social events only.
-- ============================================

-- 1.1 Update queue_message_notification trigger to NO LONGER insert into notifications table
-- Messages are handled entirely by the real-time messaging system (useMessaging hook)
CREATE OR REPLACE FUNCTION public.queue_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ============================================
  -- MESSAGE NOTIFICATIONS STRATEGY (v2):
  -- 
  -- Messages are handled entirely by the real-time messaging system:
  -- - useMessaging hook with Supabase realtime subscriptions
  -- - Conversation unread_count tracked via conversation_participants.last_read_at
  -- - Green badges throughout the app use this hook
  --
  -- We do NOT insert into the notifications table for messages.
  -- The notifications table is reserved for social events:
  -- likes, follows, comments, achievements, etc.
  --
  -- If push notifications (OneSignal) are needed in future,
  -- add push notification logic here WITHOUT touching the notifications table.
  -- ============================================
  
  -- Future: Push notification logic can go here
  -- INSERT INTO notification_queue (...) for push only
  
  RETURN NEW;
END;
$$;

-- 1.2 Clean up ALL legacy message notifications - mark as read so they don't pollute badge counts
UPDATE public.notifications 
SET is_read = true, read = true, updated_at = NOW()
WHERE type IN ('message', 'message_received', 'dm') 
  AND (is_read = false OR read = false);

-- 4.2 Update mark_conversation_read to also clean up any legacy notifications
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the participant's last_read_at timestamp
  UPDATE public.conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = auth.uid();
    
  -- Also update message delivery status to 'read' for messages we haven't sent
  UPDATE public.messages
  SET delivery_status = 'read',
      read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND (delivery_status IS NULL OR delivery_status != 'read');
    
  -- Belt-and-suspenders: Clean up any legacy message notifications for this conversation
  -- This ensures complete separation between messaging and notification systems
  UPDATE public.notifications 
  SET is_read = true, read = true, updated_at = NOW()
  WHERE user_id = auth.uid() 
    AND type IN ('message', 'message_received', 'dm')
    AND is_read = false
    AND data->>'conversation_id' = p_conversation_id::text;
END;
$$;