-- ROLLBACK (definition captured 18 Sep 2026, before this change):
--   CREATE OR REPLACE FUNCTION public.reaction_target_owner(p_target_type text, p_target_id uuid)
--    RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
--   AS $f$ DECLARE v_owner uuid; BEGIN
--     IF p_target_type = 'round' THEN
--       SELECT conn.user_id INTO v_owner FROM whs_scores s
--         JOIN whs_connections conn ON conn.id = s.connection_id WHERE s.id = p_target_id;
--     ELSIF p_target_type = 'review' THEN
--       SELECT r.user_id INTO v_owner FROM course_ratings r WHERE r.id = p_target_id;
--     END IF; RETURN v_owner; END; $f$;
CREATE OR REPLACE FUNCTION public.reaction_target_owner(p_target_type text, p_target_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
BEGIN
  IF p_target_type = 'round' THEN
    -- 18 Sep 2026: deleted_at filter moved IN HERE from comments_v2_notify's
    -- inline join. Enumeration first: the only executable caller besides
    -- comments_v2_notify is tg_notify_content_reaction (trigger
    -- notify_content_reaction on content_reactions) -- no views, no RPCs, no
    -- client call site -- so this changes nothing else. Every reader in the app
    -- filters whs_connections.deleted_at IS NULL, so a like on a round whose
    -- connection is soft-deleted was notifying someone who no longer owns it.
    -- NULL here means: raise no notification, never guess an owner.
    SELECT conn.user_id INTO v_owner
    FROM whs_scores s
    JOIN whs_connections conn ON conn.id = s.connection_id
    WHERE s.id = p_target_id
      AND conn.deleted_at IS NULL;
  ELSIF p_target_type = 'review' THEN
    -- Scoped deliberately: a review's author is course_ratings.user_id and
    -- touches no connection, so the filter above does NOT gate reviews.
    SELECT r.user_id INTO v_owner
    FROM course_ratings r
    WHERE r.id = p_target_id;
  END IF;

  RETURN v_owner;
END;
$function$;

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
  v_round jsonb := '{}'::jsonb;   -- round fields, empty for a normal post
  v_score_id uuid;
  v_subject_course_id uuid;       -- review's course, for the permalink
BEGIN
  -- 1) recipient resolution
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
    v_recipient_uid := NEW.target_id;  -- top-ten owner
    v_recipient_atyp := 'personal'; v_recipient_aid := NEW.target_id;
    v_type := 'top_ten_comment';
    SELECT gc.name INTO v_course_name FROM golf_courses gc WHERE gc.id = NEW.target_secondary_id;
    v_title := CASE WHEN v_course_name IS NOT NULL
               THEN ' commented on your ' || v_course_name || ' Top 10'
               ELSE ' commented on your Top 10' END;
  ELSIF NEW.target_type = 'round' THEN
    -- the round's owner, resolved by the same function the reaction
    -- trigger uses, so a like and a comment on a round tell the same person.
    --
    -- DIVERGENCE, OPENED AND CLOSED (18 Sep 2026): for one migration this branch
    -- used an inline join through whs_connections filtering deleted_at, because
    -- reaction_target_owner did not filter it. The enumeration showed the
    -- reaction trigger is its only other caller, so the filter moved INSIDE the
    -- resolver and this branch went back to the single call. One resolver, one
    -- rule, and the sentence above is true again. G7.1(d) still holds: whs_scores
    -- has NO user_id, the owner is whs_scores.connection_id ->
    -- whs_connections.user_id with deleted_at IS NULL, and where the connection
    -- is missing, deleted or carries no user, NO notification is raised.
    v_recipient_uid := public.reaction_target_owner('round', NEW.target_id);
    IF v_recipient_uid IS NULL THEN RETURN NEW; END IF;
    v_recipient_atyp := 'personal'; v_recipient_aid := v_recipient_uid;
    v_type := 'comment'; v_title := ' commented on your round';
  ELSIF NEW.target_type = 'review' THEN
    -- The review's author is course_ratings.user_id, directly -- no hop. ONE
    -- read of the row for both the recipient and the permalink's course.
    SELECT r.user_id, r.course_id INTO v_recipient_uid, v_subject_course_id
      FROM course_ratings r WHERE r.id = NEW.target_id;
    IF v_recipient_uid IS NULL THEN RETURN NEW; END IF;
    v_recipient_atyp := 'personal'; v_recipient_aid := v_recipient_uid;
    v_type := 'comment'; v_title := ' commented on your review';
    SELECT gc.name INTO v_course_name FROM golf_courses gc WHERE gc.id = v_subject_course_id;
  ELSE
    RETURN NEW;  -- editorial / story top-level: platform content, no recipient
  END IF;

  -- A COMMENT ON A ROUND CARRIES THE ROUND, so the tap opens the scorecard
  -- instead of bouncing through /post/:id. A native 'round' comment carries its
  -- own target; a legacy round POST comment is resolved through the post.
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

  -- 2) self-guard on actor identity
  IF COALESCE(NEW.actor_type,'personal') = v_recipient_atyp
     AND COALESCE(NEW.actor_id, NEW.user_id) = v_recipient_aid THEN RETURN NEW; END IF;
  -- 3) blocks, both directions
  IF EXISTS (SELECT 1 FROM user_blocks
             WHERE (blocker_id = v_recipient_uid AND blocked_id = NEW.user_id)
                OR (blocker_id = NEW.user_id AND blocked_id = v_recipient_uid)) THEN RETURN NEW; END IF;
  -- 4) actor display
  IF COALESCE(NEW.actor_type,'personal') = 'business' THEN
    SELECT b.name, b.logo_url INTO v_actor_name, v_actor_avatar
      FROM business_accounts b WHERE b.id = NEW.actor_id;
  ELSE
    SELECT COALESCE(up.display_name, up.username, 'Someone'), up.profile_photo_url
      INTO v_actor_name, v_actor_avatar FROM user_profiles up WHERE up.id = NEW.user_id;
  END IF;
  v_actor_name := COALESCE(v_actor_name, 'Someone');
  -- 5) preview w/ mention-markup strip
  v_preview := regexp_replace(COALESCE(NEW.content,''),
               '@\[([^\]]+)\]\((u|b):[0-9a-fA-F-]{36}\)', '@\1', 'g');
  IF length(v_preview) > 60 THEN v_preview := left(v_preview, 60) || '…'; END IF;
  IF v_preview = '' AND NEW.media_url IS NOT NULL THEN v_preview := 'Sent a photo'; END IF;
  -- 6) entity mapping (deep-link parity with old types). 'editorial_card' is
  -- unreachable: the ELSE above returns before this point. Left as the default
  -- rather than removed, so no one reads its absence as an invitation.
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