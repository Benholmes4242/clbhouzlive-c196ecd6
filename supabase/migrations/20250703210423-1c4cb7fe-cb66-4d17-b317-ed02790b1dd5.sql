-- Add notification preferences to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "new_follower": true,
  "post_likes": true,
  "post_comments": true,
  "post_shares": true,
  "tagged_in_post": true,
  "course_activity": false,
  "golf_news": false,
  "push_enabled": false
}'::jsonb;

-- Add push notification tokens table
CREATE TABLE public.push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  device_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, token, platform)
);

-- Enable RLS on push notification tokens
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push tokens
CREATE POLICY "Users can manage their own push tokens"
ON public.push_notification_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Extend notifications table with additional notification types
-- Add new notification types for likes, comments, shares
-- (The existing table structure supports these already via the type and data fields)

-- Create function to send push notifications
CREATE OR REPLACE FUNCTION public.send_push_notification(
  target_user_id UUID,
  notification_type TEXT,
  title TEXT,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  user_preferences JSONB;
  should_send BOOLEAN := false;
BEGIN
  -- Get user notification preferences
  SELECT notification_preferences INTO user_preferences
  FROM public.user_profiles
  WHERE id = target_user_id;
  
  -- Check if user wants this type of notification
  CASE notification_type
    WHEN 'follow' THEN
      should_send := COALESCE((user_preferences->>'new_follower')::boolean, true);
    WHEN 'like' THEN
      should_send := COALESCE((user_preferences->>'post_likes')::boolean, true);
    WHEN 'comment' THEN
      should_send := COALESCE((user_preferences->>'post_comments')::boolean, true);
    WHEN 'share' THEN
      should_send := COALESCE((user_preferences->>'post_shares')::boolean, true);
    WHEN 'tag' THEN
      should_send := COALESCE((user_preferences->>'tagged_in_post')::boolean, true);
    WHEN 'course_activity' THEN
      should_send := COALESCE((user_preferences->>'course_activity')::boolean, false);
    WHEN 'golf_news' THEN
      should_send := COALESCE((user_preferences->>'golf_news')::boolean, false);
    ELSE
      should_send := true;
  END CASE;
  
  -- Only create notification if user wants it
  IF should_send THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (target_user_id, notification_type, title, message, data);
    
    -- Here we would also trigger actual push notification to devices
    -- This would be handled by an edge function with FCM/APNS integration
  END IF;
END;
$$;

-- Create function to handle post likes
CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
DECLARE
  post_owner_id UUID;
  liker_name TEXT;
  post_content_preview TEXT;
  course_name TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user liked their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's name
  SELECT COALESCE(display_name, username, 'Someone') INTO liker_name
  FROM public.user_profiles
  WHERE id = NEW.user_id;
  
  -- Get post content preview
  SELECT LEFT(COALESCE(content, ''), 50) INTO post_content_preview
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Get course name if post is tagged to a course
  SELECT gc.name INTO course_name
  FROM public.post_tags pt
  JOIN public.taggable_entities te ON pt.tagged_entity_id = te.id
  JOIN public.golf_courses gc ON te.entity_id = gc.id
  WHERE pt.post_id = NEW.post_id AND te.entity_type = 'course'
  LIMIT 1;
  
  -- Send notification
  PERFORM public.send_push_notification(
    post_owner_id,
    'like',
    'Post Liked',
    CASE 
      WHEN course_name IS NOT NULL THEN
        liker_name || ' liked your Moment at ' || course_name || '.'
      ELSE
        liker_name || ' liked your post.'
    END,
    jsonb_build_object(
      'post_id', NEW.post_id,
      'liker_id', NEW.user_id,
      'liker_name', liker_name,
      'content_preview', post_content_preview,
      'course_name', course_name
    )
  );
  
  RETURN NEW;
END;
$$;

-- Update existing follow notification function to use new system
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get the follower's display name or username
  SELECT COALESCE(display_name, username, 'Someone') INTO follower_name
  FROM public.user_profiles
  WHERE id = NEW.follower_id;
  
  -- Send notification using new system
  PERFORM public.send_push_notification(
    NEW.following_id,
    'follow',
    'New Follower',
    follower_name || ' started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', follower_name
    )
  );
  
  RETURN NEW;
END;
$$;