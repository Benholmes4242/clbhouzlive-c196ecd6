
-- Create an updated notifications table with specific notification types
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'follow', 'tag', 'message')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update their notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Add a trigger to create notifications when friend requests are made
CREATE OR REPLACE FUNCTION public.create_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for new friend requests (status = 'pending')
  IF NEW.status = 'pending' THEN
    -- Get the requester's display name or username
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      NEW.friend_id,
      'friend_request',
      'New Friend Request',
      COALESCE(up.display_name, up.username, 'Someone') || ' sent you a friend request',
      jsonb_build_object(
        'friend_request_id', NEW.id,
        'requester_id', NEW.user_id,
        'requester_name', COALESCE(up.display_name, up.username, 'Someone'),
        'requester_username', up.username,
        'requester_photo', up.profile_photo_url
      )
    FROM public.user_profiles up
    WHERE up.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for friend request notifications
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON public.user_friends;
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT ON public.user_friends
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friend_request_notification();

-- Add a trigger to create notifications when friend requests are accepted
CREATE OR REPLACE FUNCTION public.create_friend_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification when status changes from 'pending' to 'accepted'
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get the accepter's display name or username
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      NEW.user_id,
      'friend_accepted',
      'Friend Request Accepted',
      COALESCE(up.display_name, up.username, 'Someone') || ' accepted your friend request',
      jsonb_build_object(
        'friend_id', NEW.friend_id,
        'accepter_name', COALESCE(up.display_name, up.username, 'Someone'),
        'accepter_username', up.username,
        'accepter_photo', up.profile_photo_url
      )
    FROM public.user_profiles up
    WHERE up.id = NEW.friend_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for friend accepted notifications
DROP TRIGGER IF EXISTS friend_accepted_notification_trigger ON public.user_friends;
CREATE TRIGGER friend_accepted_notification_trigger
  AFTER UPDATE ON public.user_friends
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friend_accepted_notification();

-- Create notifications for new followers
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the follower's display name or username
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT 
    NEW.following_id,
    'follow',
    'New Follower',
    COALESCE(up.display_name, up.username, 'Someone') || ' started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', COALESCE(up.display_name, up.username, 'Someone'),
      'follower_username', up.username,
      'follower_photo', up.profile_photo_url
    )
  FROM public.user_profiles up
  WHERE up.id = NEW.follower_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follow notifications
DROP TRIGGER IF EXISTS follow_notification_trigger ON public.user_follows;
CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification();

-- Create notifications for tags/mentions
CREATE OR REPLACE FUNCTION public.create_tag_notification()
RETURNS TRIGGER AS $$
DECLARE
  tagged_user_id uuid;
  tagger_name text;
  tagger_username text;
  tagger_photo text;
  post_content_preview text;
BEGIN
  -- Only create notifications for user tags
  SELECT entity_id INTO tagged_user_id 
  FROM public.taggable_entities 
  WHERE id = NEW.tagged_entity_id AND entity_type = 'user';
  
  IF tagged_user_id IS NOT NULL THEN
    -- Get the tagger's info
    SELECT 
      COALESCE(display_name, username, 'Someone'),
      username,
      profile_photo_url
    INTO tagger_name, tagger_username, tagger_photo
    FROM public.user_profiles 
    WHERE id = NEW.tagged_by_user_id;
    
    -- Get post content preview
    SELECT LEFT(COALESCE(content, ''), 50) INTO post_content_preview
    FROM public.posts
    WHERE id = NEW.post_id;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      tagged_user_id,
      'tag',
      'You were tagged in a post',
      tagger_name || ' tagged you in a post',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'tagged_by_user_id', NEW.tagged_by_user_id,
        'tagger_name', tagger_name,
        'tagger_username', tagger_username,
        'tagger_photo', tagger_photo,
        'content_preview', post_content_preview
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tag notifications
DROP TRIGGER IF EXISTS tag_notification_trigger ON public.post_tags;
CREATE TRIGGER tag_notification_trigger
  AFTER INSERT ON public.post_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tag_notification();
