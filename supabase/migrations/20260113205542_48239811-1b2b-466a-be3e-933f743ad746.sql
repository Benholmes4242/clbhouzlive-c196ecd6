-- =============================================
-- GAME & TRIP NOTIFICATION TRIGGERS
-- =============================================
-- This migration creates database triggers that automatically
-- create notifications when game/trip events occur.

-- =============================================
-- 1. JOIN REQUEST → NOTIFY HOST
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_game_join_request()
RETURNS TRIGGER AS $$
DECLARE
  host_id UUID;
  requester_name TEXT;
  course_name_val TEXT;
BEGIN
  -- Only fire for join requests (state='requested' in your schema)
  IF NEW.state = 'requested' AND NEW.user_id IS NOT NULL THEN
    -- Get game details
    SELECT g.host_user_id, g.course_name 
    INTO host_id, course_name_val
    FROM games g WHERE g.id = NEW.game_id;
    
    -- Get requester name
    SELECT display_name INTO requester_name
    FROM user_profiles WHERE id = NEW.user_id;
    
    -- Don't notify yourself
    IF host_id IS NOT NULL AND host_id != NEW.user_id THEN
      INSERT INTO notifications (
        user_id, 
        type, 
        title, 
        message, 
        actor_id, 
        entity_type, 
        entity_id, 
        data
      ) VALUES (
        host_id,
        'game_request',
        'New join request',
        COALESCE(requester_name, 'Someone') || ' wants to join your game at ' || COALESCE(course_name_val, 'your game'),
        NEW.user_id,
        'game',
        NEW.game_id,
        jsonb_build_object(
          'game_id', NEW.game_id,
          'requester_id', NEW.user_id,
          'course_name', course_name_val,
          'request_message', NEW.request_message
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS game_join_request_trigger ON game_participants;
CREATE TRIGGER game_join_request_trigger
  AFTER INSERT ON game_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_join_request();

-- =============================================
-- 2. REQUEST ACCEPTED/DECLINED → NOTIFY REQUESTER
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_game_request_response()
RETURNS TRIGGER AS $$
DECLARE
  host_id UUID;
  course_name_val TEXT;
  game_time TIMESTAMPTZ;
BEGIN
  -- Only fire when state changes FROM 'requested' TO 'accepted' or 'rejected'
  IF OLD.state = 'requested' AND NEW.state IN ('accepted', 'rejected') THEN
    -- Get game details
    SELECT g.host_user_id, g.course_name, g.start_time
    INTO host_id, course_name_val, game_time
    FROM games g WHERE g.id = NEW.game_id;
    
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      actor_id,
      entity_type,
      entity_id,
      data
    ) VALUES (
      NEW.user_id,
      CASE WHEN NEW.state = 'accepted' THEN 'game_request_accepted' ELSE 'game_request_declined' END,
      CASE WHEN NEW.state = 'accepted' THEN 'You''re in! 🎉' ELSE 'Request declined' END,
      CASE 
        WHEN NEW.state = 'accepted' THEN 'Your request to join ' || COALESCE(course_name_val, 'the game') || ' was accepted'
        ELSE 'Your request to join ' || COALESCE(course_name_val, 'the game') || ' was declined'
      END,
      host_id,
      'game',
      NEW.game_id,
      jsonb_build_object(
        'game_id', NEW.game_id,
        'accepted', NEW.state = 'accepted',
        'course_name', course_name_val,
        'game_time', game_time
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS game_request_response_trigger ON game_participants;
CREATE TRIGGER game_request_response_trigger
  AFTER UPDATE ON game_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_request_response();

-- =============================================
-- 3. GAME INVITE → NOTIFY INVITEE
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_game_invite()
RETURNS TRIGGER AS $$
DECLARE
  host_id UUID;
  host_name TEXT;
  course_name_val TEXT;
  game_time TIMESTAMPTZ;
BEGIN
  -- Only fire for invites (state='invited')
  IF NEW.state = 'invited' AND NEW.user_id IS NOT NULL THEN
    -- Get game details
    SELECT g.host_user_id, g.course_name, g.start_time
    INTO host_id, course_name_val, game_time
    FROM games g WHERE g.id = NEW.game_id;
    
    -- Get host name
    SELECT display_name INTO host_name
    FROM user_profiles WHERE id = host_id;
    
    -- Don't notify yourself
    IF NEW.user_id != host_id THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        actor_id,
        entity_type,
        entity_id,
        data
      ) VALUES (
        NEW.user_id,
        'game_invite',
        'Game invitation 🏌️',
        COALESCE(host_name, 'Someone') || ' invited you to play at ' || COALESCE(course_name_val, 'a golf course'),
        host_id,
        'game',
        NEW.game_id,
        jsonb_build_object(
          'game_id', NEW.game_id,
          'host_id', host_id,
          'host_name', host_name,
          'course_name', course_name_val,
          'game_time', game_time
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS game_invite_trigger ON game_participants;
CREATE TRIGGER game_invite_trigger
  AFTER INSERT ON game_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_invite();

-- =============================================
-- 4. GAME CANCELLED → NOTIFY ALL PARTICIPANTS
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_game_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
  course_name_val TEXT;
  game_time TIMESTAMPTZ;
BEGIN
  -- Only fire when status changes to 'canceled'
  IF OLD.status != 'canceled' AND NEW.status = 'canceled' THEN
    course_name_val := NEW.course_name;
    game_time := NEW.start_time;
    
    -- Notify all participants except the host (who cancelled it)
    FOR participant IN 
      SELECT user_id FROM game_participants 
      WHERE game_id = NEW.id 
        AND user_id IS NOT NULL 
        AND user_id != NEW.host_user_id
        AND state IN ('accepted', 'invited')
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        actor_id,
        entity_type,
        entity_id,
        data
      ) VALUES (
        participant.user_id,
        'game_cancelled',
        'Game cancelled',
        'The game at ' || COALESCE(course_name_val, 'the course') || ' has been cancelled',
        NEW.host_user_id,
        'game',
        NEW.id,
        jsonb_build_object(
          'game_id', NEW.id,
          'course_name', course_name_val,
          'game_time', game_time
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS game_cancelled_trigger ON games;
CREATE TRIGGER game_cancelled_trigger
  AFTER UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_cancelled();

-- =============================================
-- 5. GAME UPDATED → NOTIFY PARTICIPANTS
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_game_updated()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
  changes TEXT[];
BEGIN
  -- Only fire for meaningful changes (not status changes which have their own triggers)
  IF NEW.status = OLD.status AND (
    NEW.start_time IS DISTINCT FROM OLD.start_time OR
    NEW.course_id IS DISTINCT FROM OLD.course_id OR
    NEW.course_name IS DISTINCT FROM OLD.course_name
  ) THEN
    -- Build change description
    changes := ARRAY[]::TEXT[];
    IF NEW.start_time IS DISTINCT FROM OLD.start_time THEN
      changes := array_append(changes, 'time changed');
    END IF;
    IF NEW.course_id IS DISTINCT FROM OLD.course_id OR NEW.course_name IS DISTINCT FROM OLD.course_name THEN
      changes := array_append(changes, 'course changed');
    END IF;
    
    -- Notify all participants except the host
    FOR participant IN 
      SELECT user_id FROM game_participants 
      WHERE game_id = NEW.id 
        AND user_id IS NOT NULL 
        AND user_id != NEW.host_user_id
        AND state IN ('accepted', 'invited')
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        actor_id,
        entity_type,
        entity_id,
        data
      ) VALUES (
        participant.user_id,
        'game_updated',
        'Game updated',
        'The game at ' || COALESCE(NEW.course_name, 'the course') || ' has been updated (' || array_to_string(changes, ', ') || ')',
        NEW.host_user_id,
        'game',
        NEW.id,
        jsonb_build_object(
          'game_id', NEW.id,
          'course_name', NEW.course_name,
          'game_time', NEW.start_time,
          'changes', changes
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS game_updated_trigger ON games;
CREATE TRIGGER game_updated_trigger
  AFTER UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_updated();

-- =============================================
-- TRIP NOTIFICATION TRIGGERS
-- =============================================

-- =============================================
-- 6. TRIP JOIN REQUEST → NOTIFY ORGANIZER
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_trip_join_request()
RETURNS TRIGGER AS $$
DECLARE
  organizer_id UUID;
  requester_name TEXT;
  trip_name_val TEXT;
BEGIN
  IF NEW.rsvp_status = 'requested' AND NEW.user_id IS NOT NULL THEN
    SELECT t.created_by, t.name
    INTO organizer_id, trip_name_val
    FROM trips t WHERE t.id = NEW.trip_id;
    
    SELECT display_name INTO requester_name
    FROM user_profiles WHERE id = NEW.user_id;
    
    IF organizer_id IS NOT NULL AND organizer_id != NEW.user_id THEN
      INSERT INTO notifications (
        user_id, type, title, message, actor_id, entity_type, entity_id, data
      ) VALUES (
        organizer_id,
        'trip_request',
        'New trip request',
        COALESCE(requester_name, 'Someone') || ' wants to join ' || COALESCE(trip_name_val, 'your trip'),
        NEW.user_id,
        'trip',
        NEW.trip_id,
        jsonb_build_object('trip_id', NEW.trip_id, 'requester_id', NEW.user_id, 'trip_name', trip_name_val)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trip_join_request_trigger ON trip_participants;
CREATE TRIGGER trip_join_request_trigger
  AFTER INSERT ON trip_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_trip_join_request();

-- =============================================
-- 7. TRIP REQUEST RESPONSE → NOTIFY REQUESTER
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_trip_request_response()
RETURNS TRIGGER AS $$
DECLARE
  organizer_id UUID;
  trip_name_val TEXT;
BEGIN
  IF OLD.rsvp_status = 'requested' AND NEW.rsvp_status IN ('going', 'rejected') THEN
    SELECT t.created_by, t.name
    INTO organizer_id, trip_name_val
    FROM trips t WHERE t.id = NEW.trip_id;
    
    INSERT INTO notifications (
      user_id, type, title, message, actor_id, entity_type, entity_id, data
    ) VALUES (
      NEW.user_id,
      CASE WHEN NEW.rsvp_status = 'going' THEN 'trip_request_accepted' ELSE 'trip_request_declined' END,
      CASE WHEN NEW.rsvp_status = 'going' THEN 'You''re on the trip! 🎉' ELSE 'Trip request declined' END,
      CASE 
        WHEN NEW.rsvp_status = 'going' THEN 'Your request to join ' || COALESCE(trip_name_val, 'the trip') || ' was accepted'
        ELSE 'Your request to join ' || COALESCE(trip_name_val, 'the trip') || ' was declined'
      END,
      organizer_id,
      'trip',
      NEW.trip_id,
      jsonb_build_object('trip_id', NEW.trip_id, 'accepted', NEW.rsvp_status = 'going', 'trip_name', trip_name_val)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trip_request_response_trigger ON trip_participants;
CREATE TRIGGER trip_request_response_trigger
  AFTER UPDATE ON trip_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_trip_request_response();

-- =============================================
-- 8. TRIP INVITE → NOTIFY INVITEE
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_trip_invite()
RETURNS TRIGGER AS $$
DECLARE
  organizer_id UUID;
  organizer_name TEXT;
  trip_name_val TEXT;
  trip_dates TEXT;
BEGIN
  IF NEW.rsvp_status = 'invited' AND NEW.user_id IS NOT NULL THEN
    SELECT t.created_by, t.name, 
           to_char(t.start_date, 'Mon DD') || ' - ' || to_char(t.end_date, 'Mon DD')
    INTO organizer_id, trip_name_val, trip_dates
    FROM trips t WHERE t.id = NEW.trip_id;
    
    SELECT display_name INTO organizer_name
    FROM user_profiles WHERE id = organizer_id;
    
    IF NEW.user_id != organizer_id THEN
      INSERT INTO notifications (
        user_id, type, title, message, actor_id, entity_type, entity_id, data
      ) VALUES (
        NEW.user_id,
        'trip_invite',
        'Trip invitation ✈️',
        COALESCE(organizer_name, 'Someone') || ' invited you to ' || COALESCE(trip_name_val, 'a golf trip'),
        organizer_id,
        'trip',
        NEW.trip_id,
        jsonb_build_object(
          'trip_id', NEW.trip_id, 
          'organizer_id', organizer_id, 
          'organizer_name', organizer_name,
          'trip_name', trip_name_val,
          'trip_dates', trip_dates
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trip_invite_trigger ON trip_participants;
CREATE TRIGGER trip_invite_trigger
  AFTER INSERT ON trip_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_trip_invite();

-- =============================================
-- 9. TRIP CANCELLED → NOTIFY ALL PARTICIPANTS
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_trip_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
  trip_name_val TEXT;
BEGIN
  -- Only fire when status changes to 'cancelled'
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    trip_name_val := NEW.name;
    
    -- Notify all participants except the organizer
    FOR participant IN 
      SELECT user_id FROM trip_participants 
      WHERE trip_id = NEW.id 
        AND user_id IS NOT NULL 
        AND user_id != NEW.created_by
        AND rsvp_status IN ('going', 'maybe', 'invited')
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        actor_id,
        entity_type,
        entity_id,
        data
      ) VALUES (
        participant.user_id,
        'trip_cancelled',
        'Trip cancelled',
        COALESCE(trip_name_val, 'Your trip') || ' has been cancelled',
        NEW.created_by,
        'trip',
        NEW.id,
        jsonb_build_object(
          'trip_id', NEW.id,
          'trip_name', trip_name_val
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trip_cancelled_trigger ON trips;
CREATE TRIGGER trip_cancelled_trigger
  AFTER UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION notify_trip_cancelled();

-- =============================================
-- 10. PUSH NOTIFICATION QUEUE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.push_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_notification_queue ENABLE ROW LEVEL SECURITY;

-- Service role only policy (processed by edge function)
CREATE POLICY "Service role can manage push queue" ON public.push_notification_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Index for processing unsent notifications
CREATE INDEX IF NOT EXISTS idx_push_queue_unsent ON push_notification_queue(sent_at) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_push_queue_user ON push_notification_queue(user_id);

-- =============================================
-- 11. HELPER FUNCTION TO QUEUE PUSH NOTIFICATIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.queue_push_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER AS $$
DECLARE
  device RECORD;
  queued_count INTEGER := 0;
BEGIN
  -- Get all active devices for this user
  FOR device IN 
    SELECT provider_id 
    FROM user_push_devices 
    WHERE user_id = p_user_id AND enabled = true
  LOOP
    INSERT INTO push_notification_queue (
      user_id,
      device_id,
      title,
      body,
      data
    ) VALUES (
      p_user_id,
      device.provider_id,
      p_title,
      p_body,
      p_data
    );
    queued_count := queued_count + 1;
  END LOOP;
  
  RETURN queued_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 12. UPDATE TRIGGERS TO ALSO QUEUE PUSH
-- =============================================
-- We'll create a simple wrapper that each trigger can call

CREATE OR REPLACE FUNCTION public.notify_and_push_game_join_request()
RETURNS TRIGGER AS $$
DECLARE
  host_id UUID;
  requester_name TEXT;
  course_name_val TEXT;
  push_count INTEGER;
BEGIN
  IF NEW.state = 'requested' AND NEW.user_id IS NOT NULL THEN
    SELECT g.host_user_id, g.course_name 
    INTO host_id, course_name_val
    FROM games g WHERE g.id = NEW.game_id;
    
    SELECT display_name INTO requester_name
    FROM user_profiles WHERE id = NEW.user_id;
    
    IF host_id IS NOT NULL AND host_id != NEW.user_id THEN
      -- Insert notification
      INSERT INTO notifications (
        user_id, type, title, message, actor_id, entity_type, entity_id, data
      ) VALUES (
        host_id,
        'game_request',
        'New join request',
        COALESCE(requester_name, 'Someone') || ' wants to join your game at ' || COALESCE(course_name_val, 'your game'),
        NEW.user_id,
        'game',
        NEW.game_id,
        jsonb_build_object(
          'game_id', NEW.game_id,
          'requester_id', NEW.user_id,
          'course_name', course_name_val,
          'request_message', NEW.request_message
        )
      );
      
      -- Queue push notification
      SELECT queue_push_notification(
        host_id,
        'New join request 🏌️',
        COALESCE(requester_name, 'Someone') || ' wants to join your game',
        jsonb_build_object('type', 'game_request', 'game_id', NEW.game_id)
      ) INTO push_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the original trigger with the push-enabled one
DROP TRIGGER IF EXISTS game_join_request_trigger ON game_participants;
CREATE TRIGGER game_join_request_trigger
  AFTER INSERT ON game_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_and_push_game_join_request();