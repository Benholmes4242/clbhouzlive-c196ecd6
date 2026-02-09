-- Part A: Update trigger to include review_id and reviewer_id in JSONB data
CREATE OR REPLACE FUNCTION public.notify_friends_on_course_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  friend_record RECORD;
  v_course_name TEXT;
  v_course_id UUID;
  v_actor_id UUID;
  v_recipient_actor_id UUID;
BEGIN
  -- Safety net: don't let notification failures block the rating insert
  BEGIN
    -- Get course info
    SELECT gc.name, gc.id INTO v_course_name, v_course_id
    FROM golf_courses gc WHERE gc.id = NEW.course_id;

    -- Get actor profile id
    SELECT id INTO v_actor_id FROM user_profiles WHERE id = NEW.user_id;

    -- Notify ALL accepted friends (bidirectional lookup)
    FOR friend_record IN
      SELECT CASE 
        WHEN uf.user_id = NEW.user_id THEN uf.friend_id 
        ELSE uf.user_id 
      END AS friend_user_id
      FROM user_friends uf
      WHERE (uf.user_id = NEW.user_id OR uf.friend_id = NEW.user_id) 
        AND uf.status = 'accepted'
    LOOP
      -- Get recipient actor id
      SELECT id INTO v_recipient_actor_id FROM user_profiles WHERE id = friend_record.friend_user_id;

      INSERT INTO notifications (
        user_id,
        type,
        actor_id,
        actor_type,
        entity_type,
        entity_id,
        recipient_actor_id,
        data
      ) VALUES (
        friend_record.friend_user_id,
        'friend_course_review',
        v_actor_id,
        'user',
        'course_rating',
        NEW.id::text,
        v_recipient_actor_id,
        jsonb_build_object(
          'course_name', v_course_name,
          'rating', NEW.rating,
          'course_id', v_course_id,
          'review_id', NEW.id,
          'reviewer_id', NEW.user_id
        )
      );
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_friends_on_course_review failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Part B: Backfill existing records with review_id (entity_id IS the review id)
UPDATE notifications
SET data = data || jsonb_build_object('review_id', entity_id)
WHERE type = 'friend_course_review'
  AND entity_id IS NOT NULL
  AND (data IS NULL OR data->>'review_id' IS NULL);