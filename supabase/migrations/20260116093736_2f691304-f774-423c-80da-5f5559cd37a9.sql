-- ============================================================================
-- FIX STUCK FRIEND REQUEST BETWEEN BENJAMIN & THOMAS HOLMES
-- ============================================================================
UPDATE user_friends 
SET status = 'accepted', updated_at = now()
WHERE id = '4ee86245-f222-486b-8f5e-7aab444ac076';

-- ============================================================================
-- TRIGGER 1: Create notification when friend request is sent (INSERT with status='pending')
-- ============================================================================
CREATE OR REPLACE FUNCTION create_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status is pending (new friend request)
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (
      user_id, 
      type, 
      actor_id, 
      title, 
      message, 
      data, 
      entity_type, 
      entity_id,
      is_read
    )
    VALUES (
      NEW.friend_id,
      'friend_request',
      NEW.user_id,
      'Friend request',
      'sent you a friend request',
      jsonb_build_object('requester_id', NEW.user_id, 'request_id', NEW.id),
      'friend_request',
      NEW.id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_friend_request_created ON user_friends;

-- Create the trigger for INSERT
CREATE TRIGGER on_friend_request_created
AFTER INSERT ON user_friends
FOR EACH ROW
EXECUTE FUNCTION create_friend_request_notification();

-- ============================================================================
-- TRIGGER 2: Create notification when friend request is accepted (UPDATE status to 'accepted')
-- ============================================================================
CREATE OR REPLACE FUNCTION create_friend_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status changed from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Notify the original requester (user_id) that their request was accepted
    INSERT INTO notifications (
      user_id, 
      type, 
      actor_id, 
      title, 
      message, 
      data, 
      entity_type, 
      entity_id,
      is_read
    )
    VALUES (
      NEW.user_id,
      'friend_accepted',
      NEW.friend_id,
      'Friend request accepted',
      'accepted your friend request',
      jsonb_build_object('friend_id', NEW.friend_id, 'friendship_id', NEW.id),
      'friendship',
      NEW.id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_friend_request_accepted ON user_friends;

-- Create the trigger for UPDATE
CREATE TRIGGER on_friend_request_accepted
AFTER UPDATE ON user_friends
FOR EACH ROW
EXECUTE FUNCTION create_friend_accepted_notification();