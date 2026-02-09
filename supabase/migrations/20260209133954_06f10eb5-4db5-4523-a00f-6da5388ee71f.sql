
-- Step 1: Drop the restrictive type check constraint and replace with an expanded one
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'like'::text, 'comment'::text, 'follow'::text, 'mention'::text, 'reply'::text,
    'message'::text, 'message_received'::text, 'dm'::text,
    'friend_request'::text, 'friend_accept'::text, 'friend_accepted'::text,
    'friend_declined'::text, 'friend_cancelled'::text, 'friend_request_sent'::text,
    'friend_course_review'::text, 'course_review'::text,
    'new_rating'::text, 'rating'::text,
    'tag'::text, 'mention_post'::text, 'comment_post'::text, 'like_post'::text,
    'new_post'::text, 'achievement'::text, 'achievement_unlocked'::text, 'milestone_reached'::text,
    'club_invite'::text, 'club_follow'::text, 'club_event'::text, 'club_announcement'::text, 'club_update'::text,
    'course_like'::text, 'course_follow'::text, 'course_update'::text, 'event'::text,
    'business_member_added'::text, 'business_access_request'::text,
    'business_access_approved'::text, 'business_access_declined'::text,
    'business_verification_submitted'::text, 'business_verification_approved'::text,
    'business_verification_rejected'::text, 'business_verification_removed'::text,
    'business_verification_revoked'::text, 'business_verification_more_proof_requested'::text,
    'golfer_verification_invite'::text, 'golfer_verification_submitted'::text,
    'golfer_verification_approved'::text, 'golfer_verification_rejected'::text,
    'golfer_verification_removed'::text,
    'game_request'::text, 'game_request_accepted'::text, 'game_request_declined'::text,
    'game_invite'::text, 'game_cancelled'::text, 'rsvp_update'::text,
    'game_reminder_24h'::text, 'game_reminder_2h'::text, 'game_updated'::text, 'game_completed'::text,
    'trip_request'::text, 'trip_request_accepted'::text, 'trip_request_declined'::text,
    'trip_invite'::text, 'trip_cancelled'::text, 'trip_created'::text,
    'trip_game_added'::text, 'trip_reminder'::text,
    'system'::text, 'app_update'::text, 'tip'::text
  ])
);

-- Step 2: Update existing mismatched records BEFORE creating the new trigger
UPDATE notifications SET type = 'friend_course_review' WHERE type = 'new_rating';
UPDATE notifications SET type = 'friend_course_review' WHERE type = 'friend_review';

-- Step 3: Fix the trigger function
CREATE OR REPLACE FUNCTION public.notify_friends_on_course_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  friend_record RECORD;
  reviewer_name TEXT;
  v_course_name TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username, 'A golfer')
    INTO reviewer_name
    FROM user_profiles
   WHERE id = NEW.user_id;

  SELECT name
    INTO v_course_name
    FROM golf_courses
   WHERE id = NEW.course_id;

  -- Fix 2: Query BOTH directions of user_friends
  FOR friend_record IN
    SELECT CASE
      WHEN uf.user_id = NEW.user_id THEN uf.friend_id
      ELSE uf.user_id
    END AS friend_user_id
    FROM user_friends uf
    WHERE (uf.user_id = NEW.user_id OR uf.friend_id = NEW.user_id)
      AND uf.status = 'accepted'
  LOOP
    BEGIN
      INSERT INTO notifications (
        user_id, type, title, message, data,
        actor_id, entity_type, entity_id,
        read, recipient_actor_type, recipient_actor_id
      ) VALUES (
        friend_record.friend_user_id,
        'friend_course_review',
        'Friend Review',
        reviewer_name || ' reviewed ' || COALESCE(v_course_name, 'a course'),
        jsonb_build_object(
          'course_name', v_course_name,
          'rating',      NEW.rating,
          'course_id',   NEW.course_id,
          'rating_id',   NEW.id,
          'reviewer_id', NEW.user_id
        ),
        NEW.user_id,
        'course',
        NEW.course_id,
        false,
        'personal',
        friend_record.friend_user_id
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_friends_on_course_review: failed to notify user % — %', friend_record.friend_user_id, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;
