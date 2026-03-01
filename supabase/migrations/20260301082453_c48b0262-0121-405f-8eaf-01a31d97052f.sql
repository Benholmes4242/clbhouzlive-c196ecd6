-- Fix 2.2: Update publish_scheduled_posts to clear scheduled_at and set updated_at
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  published_count INTEGER;
  post_record RECORD;
BEGIN
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
      'Your scheduled post is now live! 🎉',
      'Your post has been published as scheduled.',
      'user:' || post_record.user_id,
      jsonb_build_object('post_id', post_record.id, 'user_id', post_record.user_id)
    );
    
    published_count := COALESCE(published_count, 0) + 1;
  END LOOP;
  
  IF published_count > 0 THEN
    RAISE NOTICE 'Published % scheduled posts', published_count;
  END IF;
END;
$$;

-- Fix 2.3: Add validation trigger for scheduled posts requiring scheduled_at
-- Using a trigger instead of CHECK constraint per project guidelines (time-based validation)
CREATE OR REPLACE FUNCTION public.validate_scheduled_post()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'scheduled' AND NEW.scheduled_at IS NULL THEN
    RAISE EXCEPTION 'scheduled_at is required when status is scheduled';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_scheduled_post ON public.posts;
CREATE TRIGGER trg_validate_scheduled_post
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_scheduled_post();