-- Fix 3.6 Step 1: Add suspension column to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Partial index for efficient lookup (only indexes suspended users)
CREATE INDEX IF NOT EXISTS idx_user_profiles_suspended
  ON user_profiles (id)
  WHERE is_suspended = true;

-- Fix 3.5 + 3.6 Step 2: Update publish_scheduled_posts with push notification and suspension check
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  published_count INTEGER := 0;
  post_record RECORD;
BEGIN
  -- Fix 3.6: Fail posts from suspended users first (batch, no loop needed)
  UPDATE posts
  SET status = 'failed',
      updated_at = NOW()
  WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = posts.user_id
        AND up.is_suspended = true
    );

  -- Publish posts from non-suspended users
  FOR post_record IN
    SELECT id, user_id
    FROM posts
    WHERE status = 'scheduled'
      AND scheduled_at <= NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE posts
    SET status = 'published',
        created_at = NOW(),
        scheduled_at = NULL,
        updated_at = NOW()
    WHERE id = post_record.id;

    -- In-app notification
    INSERT INTO admin_notifications (
      type, title, message, audience, metadata
    ) VALUES (
      'scheduled_post_live',
      'Your scheduled post is now live',
      'Your post has been published as scheduled.',
      'user:' || post_record.user_id,
      jsonb_build_object('post_id', post_record.id, 'user_id', post_record.user_id)
    );

    -- Fix 3.5: Push notification via existing OneSignal queue
    PERFORM queue_push_notification(
      post_record.user_id,
      'Your post is live',
      'Your scheduled post has been published',
      jsonb_build_object(
        'type', 'scheduled_post_live',
        'post_id', post_record.id::text
      )
    );

    published_count := published_count + 1;
  END LOOP;

  IF published_count > 0 THEN
    RAISE NOTICE 'Published % scheduled posts', published_count;
  END IF;
END;
$$;