-- Remove all pending friend requests since we're moving to a follow-only system
DELETE FROM public.user_friends WHERE status = 'pending';

-- Remove friend request notifications since they're no longer relevant
DELETE FROM public.notifications WHERE type = 'friend_request';

-- Drop the friend request notification trigger and function since we only want follow notifications now
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON public.user_friends;
DROP FUNCTION IF EXISTS public.create_friend_request_notification();

-- Update the friend accepted notification function to only create follow relationships
-- and remove the notification since friend acceptance is no longer a concept
DROP TRIGGER IF EXISTS friend_accepted_notification_trigger ON public.user_friends;
DROP FUNCTION IF EXISTS public.create_friend_accepted_notification();

-- Drop existing follow notification trigger if it exists and recreate it
DROP TRIGGER IF EXISTS follow_notification_trigger ON public.user_follows;

-- Add a follow notification trigger to the user_follows table
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
CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification();

-- Update the posts RLS policy to show posts from followed users instead of friends
DROP POLICY IF EXISTS "Users can view posts from friends and their own posts" ON public.posts;

CREATE POLICY "Users can view posts from followed users and their own posts" 
  ON public.posts 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_follows 
      WHERE follower_id = auth.uid() AND following_id = posts.user_id
    )
  );

-- Update post_media RLS policy to match the new posts policy
DROP POLICY IF EXISTS "Users can view media from viewable posts" ON public.post_media;

CREATE POLICY "Users can view media from followed users posts and their own posts" 
  ON public.post_media 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_media.post_id 
      AND (
        auth.uid() = posts.user_id OR 
        EXISTS (
          SELECT 1 FROM public.user_follows 
          WHERE follower_id = auth.uid() AND following_id = posts.user_id
        )
      )
    )
  );