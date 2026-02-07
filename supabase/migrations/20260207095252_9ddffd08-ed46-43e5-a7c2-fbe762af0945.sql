
-- Fix: notify_friends_on_course_review trigger was missing recipient_actor_id
-- and recipient_actor_type in the INSERT INTO notifications, causing a NOT NULL
-- constraint violation that silently rolled back the entire course_ratings insert.

CREATE OR REPLACE FUNCTION public.notify_friends_on_course_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  friend_record RECORD;
  reviewer_name TEXT;
  course_name TEXT;
  rating_label TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only trigger on new reviews (not updates)
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Skip mock reviews
  IF NEW.is_mock = true THEN
    RETURN NEW;
  END IF;

  -- Get reviewer's display name
  SELECT COALESCE(display_name, username, 'Someone') INTO reviewer_name
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Get course name
  SELECT name INTO course_name
  FROM golf_courses
  WHERE id = NEW.course_id;

  -- Determine rating label based on score (1-10 scale)
  rating_label := CASE
    WHEN NEW.rating >= 9.0 THEN 'Outstanding'
    WHEN NEW.rating >= 8.0 THEN 'Excellent'
    WHEN NEW.rating >= 7.0 THEN 'Very Good'
    WHEN NEW.rating >= 6.5 THEN 'Good'
    ELSE 'Fair'
  END;

  -- Build notification content
  notification_title := reviewer_name || ' reviewed a course';
  notification_message := reviewer_name || ' rated ' || course_name || ' a ' || 
                          ROUND(NEW.rating::numeric, 1)::text || ' - ' || rating_label;

  -- Loop through all accepted friends of the reviewer
  FOR friend_record IN
    SELECT 
      CASE 
        WHEN uf.user_id = NEW.user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_user_id
    FROM user_friends uf
    WHERE uf.status = 'accepted'
    AND (uf.user_id = NEW.user_id OR uf.friend_id = NEW.user_id)
  LOOP
    -- Insert in-app notification (now includes recipient_actor_id/type)
    INSERT INTO notifications (
      user_id,
      recipient_actor_type,
      recipient_actor_id,
      type,
      title,
      message,
      actor_id,
      entity_type,
      entity_id,
      data,
      is_read,
      is_deleted
    ) VALUES (
      friend_record.friend_user_id,
      'personal',
      friend_record.friend_user_id,
      'friend_course_review',
      notification_title,
      notification_message,
      NEW.user_id,
      'course_rating',
      NEW.id,
      jsonb_build_object(
        'course_id', NEW.course_id,
        'course_name', course_name,
        'rating', NEW.rating,
        'rating_label', rating_label,
        'reviewer_id', NEW.user_id,
        'reviewer_name', reviewer_name
      ),
      false,
      false
    );

    -- Queue push notification for this friend
    INSERT INTO push_notification_queue (
      user_id,
      title,
      body,
      data
    ) VALUES (
      friend_record.friend_user_id,
      notification_title,
      notification_message,
      jsonb_build_object(
        'type', 'friend_course_review',
        'course_id', NEW.course_id::text,
        'rating_id', NEW.id::text,
        'actor_id', NEW.user_id::text
      )
    );
  END LOOP;

  RETURN NEW;
END;
$function$;
