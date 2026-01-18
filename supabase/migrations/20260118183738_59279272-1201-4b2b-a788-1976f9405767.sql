-- Fix: Ensure the create_friend_accepted_notification function bypasses RLS
-- by recreating it with SECURITY INVOKER (uses caller's permissions) 
-- OR by setting the function to use SECURITY DEFINER with proper SET search_path
-- The cleanest fix is to make the function SECURITY DEFINER and bypass RLS

-- Drop and recreate the function with proper RLS bypass
CREATE OR REPLACE FUNCTION public.create_friend_accepted_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create notification if status changed from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Notify the original requester (user_id) that their request was accepted
    -- Using SECURITY DEFINER with explicit INSERT bypasses RLS
    INSERT INTO public.notifications (
      user_id, 
      type, 
      actor_id, 
      title, 
      message, 
      data, 
      entity_type, 
      entity_id,
      is_read
    )
    VALUES (
      NEW.user_id,
      'friend_accepted',
      NEW.friend_id,
      'Friend request accepted',
      'accepted your friend request',
      jsonb_build_object('friend_id', NEW.friend_id, 'friendship_id', NEW.id),
      'friendship',
      NEW.id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_friend_accepted_notification() TO authenticated;

-- The key fix: Allow the trigger function (running as postgres/owner) to bypass RLS
-- We need to ensure the notifications table allows inserts from trigger context
-- The "System can create notifications" policy should allow this, but let's verify it's active

-- Create a more permissive policy for system/trigger inserts if needed
DO $$
BEGIN
  -- Check if policy exists and update/create as needed
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Trigger functions can create notifications'
  ) THEN
    CREATE POLICY "Trigger functions can create notifications"
    ON public.notifications
    FOR INSERT
    TO postgres
    WITH CHECK (true);
  END IF;
END $$;