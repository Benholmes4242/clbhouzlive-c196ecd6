
-- Create notifications for when someone follows a user
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
      'follower_name', COALESCE(up.display_name, up.username, 'Someone')
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
