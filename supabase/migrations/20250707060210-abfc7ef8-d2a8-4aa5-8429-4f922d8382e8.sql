-- Remove all friend relationships and clean up related data
-- This converts the app to follow-only system (no more friends)

-- Delete all existing friend relationships
DELETE FROM public.user_friends;

-- Remove any friend-related notifications since friendships no longer exist
DELETE FROM public.notifications WHERE type IN ('friend_request', 'friend_accepted');

-- Drop friend-related policies and functions since we're moving to follow-only
DROP POLICY IF EXISTS "Users can send messages to friends" ON public.messages;

-- Create new policy for messages between followed users
CREATE POLICY "Users can send messages to followed users" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (
      SELECT 1 FROM public.user_follows 
      WHERE follower_id = messages.sender_id 
      AND following_id = messages.recipient_id
    )
  );

-- Update the message notification trigger function to remove friend references
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the sender's display name or username
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT 
    NEW.recipient_id,
    'message',
    'New Message',
    COALESCE(up.display_name, up.username, 'Someone') || ' sent you a message',
    jsonb_build_object(
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'sender_name', COALESCE(up.display_name, up.username, 'Someone'),
      'content_preview', LEFT(NEW.content, 50)
    )
  FROM public.user_profiles up
  WHERE up.id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;