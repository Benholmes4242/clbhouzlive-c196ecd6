-- Create relationship status helper function
CREATE OR REPLACE FUNCTION get_relationship_status(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  result jsonb;
  is_friend boolean := false;
  pending_to_them boolean := false;
  pending_from_them boolean := false;
  is_following boolean := false;
  is_follower boolean := false;
  has_blocked_them boolean := false;
  is_blocked_by_them boolean := false;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if they are friends (accepted status in either direction)
  SELECT EXISTS (
    SELECT 1 FROM user_friends
    WHERE status = 'accepted'
    AND (
      (user_id = current_user_id AND friend_id = target_user_id)
      OR (user_id = target_user_id AND friend_id = current_user_id)
    )
  ) INTO is_friend;
  
  -- Check for pending friend request TO them
  SELECT EXISTS (
    SELECT 1 FROM user_friends
    WHERE user_id = current_user_id
    AND friend_id = target_user_id
    AND status = 'pending'
  ) INTO pending_to_them;
  
  -- Check for pending friend request FROM them
  SELECT EXISTS (
    SELECT 1 FROM user_friends
    WHERE user_id = target_user_id
    AND friend_id = current_user_id
    AND status = 'pending'
  ) INTO pending_from_them;
  
  -- Check if current user follows target
  SELECT EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = current_user_id
    AND following_id = target_user_id
  ) INTO is_following;
  
  -- Check if target follows current user
  SELECT EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = target_user_id
    AND following_id = current_user_id
  ) INTO is_follower;
  
  -- Check if current user has blocked target
  SELECT EXISTS (
    SELECT 1 FROM user_blocks
    WHERE blocker_id = current_user_id
    AND blocked_id = target_user_id
  ) INTO has_blocked_them;
  
  -- Check if target has blocked current user
  SELECT EXISTS (
    SELECT 1 FROM user_blocks
    WHERE blocker_id = target_user_id
    AND blocked_id = current_user_id
  ) INTO is_blocked_by_them;
  
  -- Build result JSON
  result := jsonb_build_object(
    'isFriend', is_friend,
    'hasPendingFriendRequestToThem', pending_to_them,
    'hasPendingFriendRequestFromThem', pending_from_them,
    'isFollowing', is_following,
    'isFollower', is_follower,
    'hasBlockedThem', has_blocked_them,
    'isBlockedByThem', is_blocked_by_them
  );
  
  RETURN result;
END;
$$;