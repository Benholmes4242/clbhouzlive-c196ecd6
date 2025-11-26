-- Phase 3A: Block-aware social behavior & cascade clean-up
-- Phase 3B: Notifications behavior polish

-- ============================================
-- 1. Helper function: check if users are blocked
-- ============================================
CREATE OR REPLACE FUNCTION are_users_blocked(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
$$;

-- ============================================
-- 2. Prevent follow if blocked
-- ============================================
CREATE OR REPLACE FUNCTION prevent_follow_if_blocked()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF are_users_blocked(NEW.follower_id, NEW.following_id) THEN
    RAISE EXCEPTION 'Cannot follow a user you have blocked or who has blocked you'
      USING ERRCODE = 'CLB01';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_follow_if_blocked ON user_follows;

CREATE TRIGGER trg_prevent_follow_if_blocked
BEFORE INSERT ON user_follows
FOR EACH ROW
EXECUTE FUNCTION prevent_follow_if_blocked();

-- ============================================
-- 3. Prevent friend request if blocked
-- ============================================
CREATE OR REPLACE FUNCTION prevent_friend_if_blocked()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF are_users_blocked(NEW.user_id, NEW.friend_id) THEN
    RAISE EXCEPTION 'Cannot send a friend request to a user you have blocked or who has blocked you'
      USING ERRCODE = 'CLB02';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_friend_if_blocked ON user_friends;

CREATE TRIGGER trg_prevent_friend_if_blocked
BEFORE INSERT ON user_friends
FOR EACH ROW
EXECUTE FUNCTION prevent_friend_if_blocked();

-- ============================================
-- 4. On block: clean up existing follows and friends
-- ============================================
CREATE OR REPLACE FUNCTION on_user_block_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove any follow relationships in either direction
  DELETE FROM user_follows
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);

  -- Remove any friend relationships in either direction
  DELETE FROM user_friends
  WHERE (user_id = NEW.blocker_id AND friend_id = NEW.blocked_id)
     OR (user_id = NEW.blocked_id AND friend_id = NEW.blocker_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_user_block_created ON user_blocks;

CREATE TRIGGER trg_on_user_block_created
AFTER INSERT ON user_blocks
FOR EACH ROW
EXECUTE FUNCTION on_user_block_created();

-- ============================================
-- 5. Update follow notification: skip if already friends
-- ============================================
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip notification if either user has blocked the other
  IF are_users_blocked(NEW.follower_id, NEW.following_id) THEN
    RETURN NEW;
  END IF;

  -- Skip notification if users are already friends
  -- (to avoid double notification when friend accept creates mutual follows)
  IF EXISTS (
    SELECT 1 FROM user_friends
    WHERE status = 'accepted'
      AND (
        (user_id = NEW.follower_id AND friend_id = NEW.following_id)
        OR (user_id = NEW.following_id AND friend_id = NEW.follower_id)
      )
  ) THEN
    RETURN NEW;
  END IF;

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    'Someone started following you',
    jsonb_build_object('follower_id', NEW.follower_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_follow_notification ON user_follows;

CREATE TRIGGER trg_create_follow_notification
AFTER INSERT ON user_follows
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();

-- ============================================
-- 6. Update friend request notification: block-aware
-- ============================================
CREATE OR REPLACE FUNCTION create_friend_request_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create notification for new pending requests
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  -- Skip notification if either user has blocked the other
  IF are_users_blocked(NEW.user_id, NEW.friend_id) THEN
    RETURN NEW;
  END IF;

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.friend_id,
    'friend_request',
    'Friend Request',
    'Someone sent you a friend request',
    jsonb_build_object('requester_id', NEW.user_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_friend_request_notification ON user_friends;

CREATE TRIGGER trg_create_friend_request_notification
AFTER INSERT ON user_friends
FOR EACH ROW
EXECUTE FUNCTION create_friend_request_notification();

-- ============================================
-- 7. Update friend accepted notification: block-aware
-- ============================================
CREATE OR REPLACE FUNCTION create_friend_accepted_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create notification when status changes to accepted
  IF OLD.status = 'accepted' OR NEW.status <> 'accepted' THEN
    RETURN NEW;
  END IF;

  -- Skip notification if either user has blocked the other
  IF are_users_blocked(NEW.user_id, NEW.friend_id) THEN
    RETURN NEW;
  END IF;

  -- Create notification for the original requester
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'friend_accepted',
    'Friend Request Accepted',
    'Your friend request was accepted',
    jsonb_build_object('acceptor_id', NEW.friend_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_friend_accepted_notification ON user_friends;

CREATE TRIGGER trg_create_friend_accepted_notification
AFTER UPDATE ON user_friends
FOR EACH ROW
EXECUTE FUNCTION create_friend_accepted_notification();