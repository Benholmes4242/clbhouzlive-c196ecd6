-- Create a function to trigger push queue processing via pg_net
-- This triggers when new push notifications are queued
CREATE OR REPLACE FUNCTION trigger_process_push_queue()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get configuration from vault or use hardcoded project URL
  supabase_url := 'https://ybxkehyomcakqjvuhnna.supabase.co';
  
  -- Use pg_net to call the edge function asynchronously
  -- This is a fire-and-forget call that won't block the insert
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/process-push-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the notification insert if push processing fails
  RAISE WARNING 'Failed to trigger push queue processing: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on push_notification_queue table
-- Uses AFTER INSERT FOR EACH STATEMENT to batch multiple inserts
DROP TRIGGER IF EXISTS on_push_queue_insert ON push_notification_queue;
CREATE TRIGGER on_push_queue_insert
AFTER INSERT ON push_notification_queue
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_process_push_queue();

-- Also create a trigger on notifications table to auto-queue push notifications
-- This ensures any notification inserted gets queued for push
CREATE OR REPLACE FUNCTION auto_queue_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue push notification for the user
  -- This will look up the user's push devices and queue notifications for each
  INSERT INTO push_notification_queue (user_id, device_id, title, body, data)
  SELECT 
    NEW.user_id,
    upd.device_id,
    COALESCE(NEW.title, 'New Notification'),
    NEW.message,
    jsonb_build_object(
      'notification_id', NEW.id,
      'type', NEW.type,
      'link', NEW.link
    )
  FROM user_push_devices upd
  WHERE upd.user_id = NEW.user_id
    AND upd.is_active = true;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail notification insert if push queueing fails
  RAISE WARNING 'Failed to queue push notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_auto_queue_push ON notifications;
CREATE TRIGGER on_notification_auto_queue_push
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION auto_queue_push_notification();