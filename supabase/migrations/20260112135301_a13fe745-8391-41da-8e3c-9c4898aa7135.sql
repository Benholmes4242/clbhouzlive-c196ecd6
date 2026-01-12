-- =============================================
-- Scheduled Posts: Add columns and pg_cron job
-- =============================================

-- 1. Add scheduled_at and status columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

-- 2. Add constraint to validate status values
ALTER TABLE public.posts
ADD CONSTRAINT posts_status_check 
CHECK (status IN ('draft', 'scheduled', 'published', 'failed'));

-- 3. Create index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_status 
ON public.posts (status, scheduled_at) 
WHERE status = 'scheduled';

-- 4. Create index for feed queries filtering by published status
CREATE INDEX IF NOT EXISTS idx_posts_status_created 
ON public.posts (status, created_at DESC) 
WHERE status = 'published';

-- 5. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 6. Create function to publish scheduled posts
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
  -- Find and update all due scheduled posts
  FOR post_record IN 
    SELECT id, user_id 
    FROM posts 
    WHERE status = 'scheduled' 
      AND scheduled_at <= NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update post to published
    UPDATE posts 
    SET status = 'published', 
        created_at = NOW() -- Update created_at so it appears fresh in feeds
    WHERE id = post_record.id;
    
    -- Insert notification for the user
    INSERT INTO admin_notifications (
      type, 
      title, 
      message, 
      audience,
      metadata
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

-- 7. Schedule the cron job to run every minute
-- Note: pg_cron jobs are managed in the cron schema
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *',  -- Every minute
  $$SELECT public.publish_scheduled_posts()$$
);

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.publish_scheduled_posts() TO service_role;