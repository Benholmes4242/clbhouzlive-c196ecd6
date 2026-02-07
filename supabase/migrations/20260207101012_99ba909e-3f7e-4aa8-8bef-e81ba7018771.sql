-- Safety net: Wrap the notification INSERT in notify_friends_on_course_review()
-- inside an EXCEPTION block so that ANY future notification failure
-- (null constraint, FK violation, etc.) never rolls back the course_ratings insert.

CREATE OR REPLACE FUNCTION public.notify_friends_on_course_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  friend_record RECORD;
  reviewer_name TEXT;
  course_name TEXT;
BEGIN
  -- Only fire on INSERT (new reviews)
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Look up reviewer display name
  SELECT COALESCE(display_name, username, 'A golfer')
    INTO reviewer_name
    FROM user_profiles
   WHERE id = NEW.user_id;

  -- Look up course name
  SELECT name
    INTO course_name
    FROM golf_courses
   WHERE id = NEW.course_id;

  -- Notify each friend — wrapped in its own sub-block so one failure
  -- never aborts the loop or the parent transaction
  FOR friend_record IN
    SELECT f.friend_user_id
      FROM friendships f
     WHERE f.user_id = NEW.user_id
       AND f.status = 'accepted'
  LOOP
    BEGIN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        actor_id,
        entity_type,
        entity_id,
        read,
        recipient_actor_type,
        recipient_actor_id
      ) VALUES (
        friend_record.friend_user_id,
        'friend_review',
        'Friend Review',
        reviewer_name || ' reviewed ' || COALESCE(course_name, 'a course'),
        jsonb_build_object(
          'course_id',   NEW.course_id,
          'rating_id',   NEW.id,
          'reviewer_id', NEW.user_id
        ),
        NEW.user_id,
        'course_rating',
        NEW.id,
        false,
        'personal',
        friend_record.friend_user_id
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log but never block the review
      RAISE WARNING 'notify_friends_on_course_review: failed to notify user % — %', friend_record.friend_user_id, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;