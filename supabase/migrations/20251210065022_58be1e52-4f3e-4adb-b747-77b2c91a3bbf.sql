-- ============================================
-- Test Lab Admin RPCs (SECURITY DEFINER)
-- These bypass RLS to allow admin-controlled Test User actions
-- ============================================

-- 1. Test Lab: send friend request from Test User to Target
CREATE OR REPLACE FUNCTION test_lab_send_friend_request(
  p_test_user_id   uuid,
  p_target_user_id uuid
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Ensure only admins can use this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  -- Upsert-style: ensure we have a row in user_friends
  INSERT INTO user_friends (user_id, friend_id, status)
  VALUES (p_test_user_id, p_target_user_id, 'pending')
  ON CONFLICT (user_id, friend_id)
  DO UPDATE SET status = 'pending'
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 2. Test Lab: update friendship status (accept / decline / removed)
CREATE OR REPLACE FUNCTION test_lab_update_friend_request(
  p_user_id      uuid,
  p_friend_id    uuid,
  p_new_status   text  -- 'accepted' | 'declined' | 'removed'
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  IF p_new_status = 'removed' THEN
    DELETE FROM user_friends
    WHERE (user_id = p_user_id AND friend_id = p_friend_id)
       OR (user_id = p_friend_id AND friend_id = p_user_id);
  ELSE
    UPDATE user_friends
    SET status = p_new_status
    WHERE (user_id = p_user_id AND friend_id = p_friend_id)
       OR (user_id = p_friend_id AND friend_id = p_user_id);
  END IF;
END;
$$;

-- 3. Test Lab: Test User follows Target
CREATE OR REPLACE FUNCTION test_lab_follow(
  p_test_user_id   uuid,
  p_target_user_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  INSERT INTO user_follows (follower_id, following_id)
  VALUES (p_test_user_id, p_target_user_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;
END;
$$;

-- 4. Test Lab: Unfollow (both directions)
CREATE OR REPLACE FUNCTION test_lab_unfollow(
  p_test_user_id   uuid,
  p_target_user_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  DELETE FROM user_follows
  WHERE (follower_id = p_test_user_id AND following_id = p_target_user_id)
     OR (follower_id = p_target_user_id AND following_id = p_test_user_id);
END;
$$;

-- 5. Test Lab: clear all friend + follow relations between Test User and Target
CREATE OR REPLACE FUNCTION test_lab_clear_relationships(
  p_test_user_id   uuid,
  p_target_user_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  -- Friends
  DELETE FROM user_friends
  WHERE (user_id = p_test_user_id AND friend_id = p_target_user_id)
     OR (user_id = p_target_user_id AND friend_id = p_test_user_id);

  -- Follows (both directions)
  DELETE FROM user_follows
  WHERE (follower_id = p_test_user_id AND following_id = p_target_user_id)
     OR (follower_id = p_target_user_id AND following_id = p_test_user_id);
END;
$$;

-- 6. Test Lab: clear notifications between Test User & Target
CREATE OR REPLACE FUNCTION test_lab_clear_notifications(
  p_test_user_id   uuid,
  p_target_user_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  DELETE FROM notifications
  WHERE 
    -- notifications TO the target, FROM the test user
    (user_id = p_target_user_id AND actor_id = p_test_user_id)
    OR
    -- notifications TO the test user, FROM the target
    (user_id = p_test_user_id AND actor_id = p_target_user_id);
END;
$$;

-- 7. Test Lab: Insert notification (bypasses RLS for any user_id/actor_id combo)
CREATE OR REPLACE FUNCTION test_lab_insert_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_message text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_is_read boolean DEFAULT false,
  p_data jsonb DEFAULT NULL,
  p_created_at timestamptz DEFAULT now()
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  INSERT INTO notifications (user_id, actor_id, type, title, message, entity_type, entity_id, is_read, data, created_at)
  VALUES (p_user_id, p_actor_id, p_type, p_title, p_message, p_entity_type, p_entity_id, p_is_read, p_data, p_created_at)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 8. Test Lab: Batch insert notifications
CREATE OR REPLACE FUNCTION test_lab_insert_notifications_batch(
  p_notifications jsonb
)
RETURNS int
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int := 0;
  v_notif jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to use Test Lab RPCs';
  END IF;

  FOR v_notif IN SELECT * FROM jsonb_array_elements(p_notifications)
  LOOP
    INSERT INTO notifications (
      user_id, 
      actor_id, 
      type, 
      title, 
      message, 
      entity_type, 
      entity_id, 
      is_read, 
      data, 
      created_at
    )
    VALUES (
      (v_notif->>'user_id')::uuid,
      (v_notif->>'actor_id')::uuid,
      v_notif->>'type',
      v_notif->>'title',
      v_notif->>'message',
      v_notif->>'entity_type',
      v_notif->>'entity_id',
      COALESCE((v_notif->>'is_read')::boolean, false),
      v_notif->'data',
      COALESCE((v_notif->>'created_at')::timestamptz, now())
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;