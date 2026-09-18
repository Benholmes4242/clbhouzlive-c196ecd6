CREATE OR REPLACE FUNCTION public.comments_v2_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_recipient_uid uuid; v_recipient_atyp text; v_recipient_aid uuid;
  v_type text; v_title text; v_entity_type text; v_entity_id uuid;
  v_actor_name text; v_actor_avatar text; v_course_name text; v_preview text;
  v_parent record; v_post record;
  v_round jsonb := '{}'::jsonb;
  v_score_id uuid;
  v_subject_course_id uuid;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id, actor_type, actor_id INTO v_parent FROM comments_v2 WHERE id = NEW.parent_id;
    IF NOT FOUND THEN RETURN NEW; END IF;
    v_recipient_uid  := v_parent.user_id;
    v_recipient_atyp := COALESCE(v_parent.actor_type, 'personal');
    v_recipient_aid  := COALESCE(v_parent.actor_id, v_parent.user_id);
    v_type  := CASE NEW.target_type WHEN 'top_ten' THEN 'top_ten_reply' ELSE 'comment' END;
    v_title := ' replied to your comment';
  ELSIF NEW.target_type = 'post' THEN
    SELECT p.user_id, p.actor_type, p.actor_id INTO v_post FROM posts p WHERE p.id = NEW.target_id;
    IF NOT FOUND OR v_post.user_id IS NULL THEN RETURN NEW; END IF;
    v_recipient_uid  := v_post.user_id;
    v_recipient_atyp := COALESCE(v_post.actor_type, 'personal');
    v_recipient_aid  := COALESCE(v_post.actor_id, v_post.user_id);
    v_type := 'comment'; v_title := ' commented on your post';
  ELSIF NEW.target_type = 'top_ten' THEN
    v_recipient_uid := NEW.target_id;
    v_recipient_atyp := 'personal'; v_recipient_aid := NEW.target_id;
    v_type := 'top_ten_comment';
    SELECT gc.name INTO v_course_name FROM golf_courses gc WHERE gc.id = NEW.target_secondary_id;
    v_title := CASE WHEN v_course_name IS NOT NULL
               THEN ' commented on your ' || v_course_name || ' Top 10'
               ELSE ' commented on your Top 10' END;
  ELSIF NEW.target_type = 'round' THEN
    -- G7.1(d) CORRECTED. whs_scores has NO user_id: the owner is reached by
    -- connection_id -> whs_connections.user_id, and every reader in the app
    -- filters deleted_at IS NULL. This branch makes that hop itself rather
    -- than through reaction_target_owner, which does NOT filter deleted_at and
    -- is left untouched because the reaction trigger depends on it. Where the
    -- connection is missing, deleted, or carries no user, NO notification is
    -- raised -- no owner is guessed.
    SELECT conn.user_id INTO v_recipient_uid
      FROM whs_scores s
      JOIN whs_connections conn ON conn.id = s.connection_id
     WHERE s.id = NEW.target_id
       AND conn.deleted_at IS NULL;
    IF v_recipient_uid IS NULL THEN RETURN NEW; END IF;
    v_recipient_atyp := 'personal'; v_recipient_aid := v_recipient_uid;
    v_type := 'comment'; v_title := ' commented on your round';
  ELSIF NEW.target_type = 'review' THEN
    SELECT r.user_id INTO v_recipient_uid FROM course_ratings r WHERE r.id = NEW.target_id;
    IF v_recipient_uid IS NULL THEN RETURN NEW; END IF;
    v_recipient_atyp := 'personal'; v_recipient_aid := v_recipient_uid;
    v_type := 'comment'; v_title := ' commented on your review';
    SELECT r.course_id INTO v_subject_course_id FROM course_ratings r WHERE r.id = NEW.target_id;
    SELECT gc.name INTO v_course_name FROM golf_courses gc WHERE gc.id = v_subject_course_id;
  ELSE
    RETURN NEW;
  END IF;

  IF NEW.target_type = 'round' THEN
    v_round := jsonb_build_object(
      'post_type', 'round', 'whs_score_id', NEW.target_id,
      'score_id', NEW.target_id, 'is_round', true
    );
  ELSIF NEW.target_type = 'post' AND public.post_is_round(NEW.target_id) THEN
    SELECT p.whs_score_id INTO v_score_id FROM posts p WHERE p.id = NEW.target_id;
    IF v_score_id IS NOT NULL THEN
      v_round := jsonb_build_object(
        'post_type', 'round', 'whs_score_id', v_score_id, 'is_round', true
      );
    END IF;
  END IF;

  IF COALESCE(NEW.actor_type,'personal') = v_recipient_atyp
     AND COALESCE(NEW.actor_id, NEW.user_id) = v_recipient_aid THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM user_blocks
             WHERE (blocker_id = v_recipient_uid AND blocked_id = NEW.user_id)
                OR (blocker_id = NEW.user_id AND blocked_id = v_recipient_uid)) THEN RETURN NEW; END IF;
  IF COALESCE(NEW.actor_type,'personal') = 'business' THEN
    SELECT b.name, b.logo_url INTO v_actor_name, v_actor_avatar
      FROM business_accounts b WHERE b.id = NEW.actor_id;
  ELSE
    SELECT COALESCE(up.display_name, up.username, 'Someone'), up.profile_photo_url
      INTO v_actor_name, v_actor_avatar FROM user_profiles up WHERE up.id = NEW.user_id;
  END IF;
  v_actor_name := COALESCE(v_actor_name, 'Someone');
  v_preview := regexp_replace(COALESCE(NEW.content,''),
               '@\[([^\]]+)\]\((u|b):[0-9a-fA-F-]{36}\)', '@\1', 'g');
  IF length(v_preview) > 60 THEN v_preview := left(v_preview, 60) || '…'; END IF;
  IF v_preview = '' AND NEW.media_url IS NOT NULL THEN v_preview := 'Sent a photo'; END IF;
  v_entity_type := CASE NEW.target_type WHEN 'post' THEN 'post'
                   WHEN 'top_ten' THEN 'top_ten'
                   WHEN 'round' THEN 'score'
                   WHEN 'review' THEN 'review'
                   ELSE 'editorial_card' END;
  v_entity_id := CASE NEW.target_type WHEN 'top_ten' THEN NEW.target_secondary_id
                 ELSE NEW.target_id END;

  INSERT INTO notifications (user_id, recipient_actor_type, recipient_actor_id,
    actor_id, type, title, message, entity_type, entity_id, is_read, read, data)
  VALUES (v_recipient_uid, v_recipient_atyp, v_recipient_aid, NEW.user_id, v_type,
    v_actor_name || v_title, v_preview, v_entity_type, v_entity_id, FALSE, FALSE,
    jsonb_build_object('comment_id', NEW.id, 'parent_comment_id', NEW.parent_id,
      'target_type', NEW.target_type, 'target_id', NEW.target_id,
      'target_secondary_id', NEW.target_secondary_id,
      'post_id', CASE WHEN NEW.target_type='post' THEN NEW.target_id END,
      'course_id', CASE WHEN NEW.target_type='top_ten' THEN NEW.target_secondary_id
                        WHEN NEW.target_type='review' THEN v_subject_course_id END,
      'review_id', CASE WHEN NEW.target_type='review' THEN NEW.target_id END,
      'course_name', v_course_name, 'target_user_id',
      CASE WHEN NEW.target_type='top_ten' THEN NEW.target_id END,
      'commenter_actor_type', COALESCE(NEW.actor_type,'personal'),
      'commenter_actor_id', COALESCE(NEW.actor_id, NEW.user_id),
      'actor_name', v_actor_name, 'actor_avatar', v_actor_avatar,
      'actor_avatar_url', v_actor_avatar) || v_round)
  ON CONFLICT (user_id, type, actor_id, entity_id) DO UPDATE
    SET message = EXCLUDED.message, title = EXCLUDED.title, data = EXCLUDED.data,
        is_read = FALSE, read = FALSE, is_deleted = FALSE, updated_at = now();
  RETURN NEW;
END; $function$;