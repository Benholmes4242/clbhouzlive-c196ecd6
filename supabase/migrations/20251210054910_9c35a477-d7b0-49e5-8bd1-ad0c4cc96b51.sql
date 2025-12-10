-- Remove duplicate friend notification triggers (keep only client-side inserts)

-- FRIEND REQUEST trigger
DROP TRIGGER IF EXISTS trg_create_friend_request_notification ON user_friends;
DROP FUNCTION IF EXISTS create_friend_request_notification();

-- FRIEND ACCEPTED trigger  
DROP TRIGGER IF EXISTS trg_create_friend_accepted_notification ON user_friends;
DROP FUNCTION IF EXISTS create_friend_accepted_notification();

-- Clean up old duplicate rows with null actor_id
DELETE FROM notifications
WHERE type IN ('friend_request', 'friend_accepted')
  AND actor_id IS NULL;