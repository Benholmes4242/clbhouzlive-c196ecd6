CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  published_count INTEGER := 0;
  failed_record RECORD;
  post_record RECORD;
BEGIN
  -- Mark posts from suspended users as failed (and notify the author).
  FOR failed_record IN
    SELECT p.id, p.user_id
    FROM posts p
    WHERE p.status = 'scheduled'
      AND p.scheduled_at <= NOW()
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = p.user_id
          AND up.is_suspended = true
      )
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE posts
       SET status = 'failed',
           updated_at = NOW()
     WHERE id = failed_record.id;

    INSERT INTO admin_notifications (
      type, title, message, audience, metadata
    ) VALUES (
      'scheduled_post_failed',
      'Scheduled post failed to publish',
      'Your scheduled post could not be published. Open Scheduled posts to retry or edit.',
      'user:' || failed_record.user_id,
      jsonb_build_object('post_id', failed_record.id, 'user_id', failed_record.user_id)
    );

    PERFORM queue_push_notification(
      failed_record.user_id,
      'Scheduled post failed',
      'Tap to retry or edit your scheduled post.',
      jsonb_build_object(
        'type', 'scheduled_post_failed',
        'post_id', failed_record.id::text
      )
    );
  END LOOP;

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

    INSERT INTO admin_notifications (
      type, title, message, audience, metadata
    ) VALUES (
      'scheduled_post_live',
      'Your scheduled post is now live',
      'Your post has been published as scheduled.',
      'user:' || post_record.user_id,
      jsonb_build_object('post_id', post_record.id, 'user_id', post_record.user_id)
    );

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
$function$;