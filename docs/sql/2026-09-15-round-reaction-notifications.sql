-- =====================================================================
-- ROUND REACTION NOTIFICATIONS CARRY THE ROUND
-- 2026-09-15. DRAFT - NOT APPLIED. Ben runs this.
--
-- WHY: only create_new_post_notifications writes post_type / whs_score_id /
-- is_round onto a notification, so a LIKE, COMMENT or MENTION on a round post
-- routes through /post/:id, which can only redirect. This file makes the three
-- reaction triggers write THE SAME FIELDS, WITH THE SAME KEY NAMES AND SHAPE,
-- when the target post is a round. Nothing changes for a non-round post: the
-- appended object is empty, so the data payload is byte-identical to today's.
--
-- new_post IS NOT TOUCHED.
--
-- WHICH FUNCTIONS (verified deployed, 2026-09-15):
--   like     -> public.create_like_notification_aggregated()  TRIGGER ON post_likes
--   comment  -> public.comments_v2_notify()                   TRIGGER ON comments_v2
--   mention  -> public.create_mention_notification()          TRIGGER ON mentions
-- NOTE the comment notification is written by comments_v2_notify, NOT by the
-- create_comment_notification recorded in docs/notifications/2026-07-08-*.md:
-- that function is no longer attached to any table (comments moved to
-- comments_v2). Reported, not silently assumed.
--
-- ROUNDNESS TEST: public.post_is_round(post_id), i.e. posts.whs_score_id IS NOT
-- NULL - the same predicate the brief names.
--
-- SAFETY: one transaction. Asserts the deployed md5 of each function before it
-- rewrites it, refuses to run a second time, asserts the backfill row counts
-- before updating, and reads back at the end. Any failed assertion aborts the
-- whole file. No backslash meta-commands.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. CHAIN GUARDS
-- ---------------------------------------------------------------------
DO $guard$
DECLARE
  v_expected CONSTANT jsonb := jsonb_build_object(
    'create_like_notification_aggregated', '3cf539fc70dd5962796ae86303f1672b',
    'comments_v2_notify',                   '5bdd299c7826e2b3b570963240305540',
    'create_mention_notification',          'a3457aca9b6af7dc2bf3cbdb87f2f6dc'
  );
  v_name text;
  v_def  text;
  v_md5  text;
BEGIN
  FOR v_name IN SELECT jsonb_object_keys(v_expected) LOOP
    SELECT pg_get_functiondef(p.oid) INTO v_def
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = v_name;

    IF v_def IS NULL THEN
      RAISE EXCEPTION 'CHAIN BROKEN: public.% does not exist', v_name;
    END IF;

    -- REFUSE TO RUN TWICE. Every rebuilt body below declares v_round; the
    -- deployed bodies do not mention it anywhere.
    IF v_def LIKE '%v_round%' THEN
      RAISE EXCEPTION 'ALREADY APPLIED: public.% already carries the round fields', v_name;
    END IF;

    v_md5 := md5(v_def);
    IF v_md5 <> (v_expected->>v_name) THEN
      RAISE EXCEPTION 'CHAIN BROKEN: public.% md5 is %, expected %',
        v_name, v_md5, (v_expected->>v_name);
    END IF;
  END LOOP;

  IF to_regprocedure('public.post_is_round(uuid)') IS NULL THEN
    RAISE EXCEPTION 'CHAIN BROKEN: public.post_is_round(uuid) is missing';
  END IF;

  RAISE NOTICE 'chain ok: three reaction functions match their deployed md5';
END
$guard$;

-- ---------------------------------------------------------------------
-- 1. LIKES - public.create_like_notification_aggregated()
--    Deployed body, unchanged except: post_record also selects whs_score_id,
--    v_round is computed once, and each of the FOUR data payloads (personal
--    update, personal insert, business update, business insert) appends it.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_like_notification_aggregated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  AGGREGATION_WINDOW INTERVAL := INTERVAL '6 hours';
  post_record RECORD;
  liker_name TEXT;
  liker_avatar TEXT;
  liker_user_id UUID;
  liker_actor_type TEXT;
  liker_actor_id UUID;
  v_anchor_user_id UUID;
  existing_notif_id UUID;
  existing_data JSONB;
  existing_count INTEGER;
  existing_recent_names JSONB;
  new_recent_names JSONB;
  new_count INTEGER;
  recipient_user_id UUID;
  recipient_actor_id_val UUID;
  recipient_actor_type_val TEXT;
  new_message TEXT;
  -- A REACTION ON A ROUND CARRIES THE ROUND. Same keys, same shape as
  -- create_new_post_notifications. Empty for a normal post, so its payload is
  -- unchanged.
  v_round JSONB := '{}'::jsonb;
BEGIN
  SELECT user_id, actor_id, actor_type, id, whs_score_id
  INTO post_record
  FROM public.posts WHERE id = NEW.post_id;

  IF post_record IS NULL THEN RETURN NEW; END IF;

  IF post_record.whs_score_id IS NOT NULL AND public.post_is_round(NEW.post_id) THEN
    v_round := jsonb_build_object(
      'post_type',    'round',
      'whs_score_id', post_record.whs_score_id,
      'is_round',     true
    );
  END IF;

  liker_user_id := NEW.user_id;
  liker_actor_type := COALESCE(NEW.actor_type, 'personal');
  liker_actor_id := COALESCE(NEW.actor_id, NEW.user_id);

  IF liker_actor_type = 'business' THEN
    SELECT name, logo_url INTO liker_name, liker_avatar
    FROM public.business_accounts WHERE id = liker_actor_id;
  ELSE
    SELECT COALESCE(display_name, username, 'Someone'), profile_photo_url
      INTO liker_name, liker_avatar
    FROM public.user_profiles WHERE id = liker_user_id;
  END IF;

  IF liker_name IS NULL THEN liker_name := 'Someone'; END IF;

  IF post_record.actor_type = 'personal' THEN
    recipient_user_id := post_record.user_id;
    recipient_actor_id_val := post_record.actor_id;
    recipient_actor_type_val := 'personal';

    IF liker_actor_type = 'personal' AND liker_user_id = recipient_user_id THEN
      RETURN NEW;
    END IF;
    IF are_users_blocked(liker_user_id, recipient_user_id) THEN RETURN NEW; END IF;

    SELECT id, data INTO existing_notif_id, existing_data
    FROM public.notifications
    WHERE recipient_actor_id = recipient_actor_id_val
      AND recipient_actor_type = recipient_actor_type_val
      AND type = 'like' AND entity_type = 'post' AND entity_id = NEW.post_id
      AND is_read = false AND created_at > NOW() - AGGREGATION_WINDOW
    ORDER BY created_at DESC LIMIT 1;

    IF existing_notif_id IS NOT NULL THEN
      existing_count := COALESCE((existing_data->>'like_count')::INTEGER, 1);
      existing_recent_names := COALESCE(existing_data->'recent_liker_names', '[]'::jsonb);
      IF NOT (existing_data->'recent_liker_ids' ? liker_actor_id::TEXT) THEN
        new_count := existing_count + 1;
        new_recent_names := existing_recent_names || to_jsonb(liker_name);
        IF jsonb_array_length(new_recent_names) > 5 THEN
          new_recent_names := jsonb_path_query_array(new_recent_names, '$[1 to 5]');
        END IF;
        IF new_count = 1 THEN new_message := (new_recent_names->>0) || ' liked your post';
        ELSIF new_count = 2 THEN new_message := (new_recent_names->>0) || ' and 1 other liked your post';
        ELSE new_message := (new_recent_names->>0) || ' and ' || (new_count - 1) || ' others liked your post';
        END IF;
        BEGIN
          UPDATE public.notifications
          SET data = jsonb_build_object(
                'post_id', NEW.post_id,
                'like_count', new_count,
                'recent_liker_ids',
                  COALESCE(existing_data->'recent_liker_ids', '[]'::jsonb) || to_jsonb(liker_actor_id::TEXT),
                'recent_liker_names', new_recent_names,
                'actor_type', liker_actor_type,
                'actor_id', liker_actor_id,
                'actor_name', liker_name,
                'actor_avatar_url', liker_avatar
              ) || v_round,
              message = new_message,
              actor_id = liker_user_id,
              updated_at = NOW()
          WHERE id = existing_notif_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END IF;
    ELSE
      BEGIN
        INSERT INTO public.notifications (
          user_id, recipient_actor_id, recipient_actor_type, actor_id,
          type, title, message, entity_type, entity_id, data, is_read, read
        ) VALUES (
          recipient_user_id, recipient_actor_id_val, recipient_actor_type_val, liker_user_id,
          'like', 'New like', liker_name || ' liked your post', 'post', NEW.post_id,
          jsonb_build_object(
            'post_id', NEW.post_id,
            'like_count', 1,
            'recent_liker_ids', jsonb_build_array(liker_actor_id::TEXT),
            'recent_liker_names', jsonb_build_array(liker_name),
            'actor_type', liker_actor_type,
            'actor_id', liker_actor_id,
            'actor_name', liker_name,
            'actor_avatar_url', liker_avatar
          ) || v_round,
          false, false
        );
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
    END IF;

  ELSIF post_record.actor_type = 'business' THEN
    recipient_actor_id_val := post_record.actor_id;
    recipient_actor_type_val := 'business';

    IF liker_actor_type = 'business' AND liker_actor_id = post_record.actor_id THEN
      RETURN NEW;
    END IF;

    -- ONE shared business row anchored to deterministic manager
    SELECT user_profile_id INTO v_anchor_user_id
      FROM public.business_members
     WHERE business_id = post_record.actor_id
       AND role IN ('owner','admin','editor')
     ORDER BY (role='owner') DESC, (role='admin') DESC, user_profile_id ASC
     LIMIT 1;

    IF v_anchor_user_id IS NULL THEN RETURN NEW; END IF;
    IF are_users_blocked(liker_user_id, v_anchor_user_id) THEN RETURN NEW; END IF;

    SELECT id, data INTO existing_notif_id, existing_data
    FROM public.notifications
    WHERE recipient_actor_id = recipient_actor_id_val
      AND recipient_actor_type = recipient_actor_type_val
      AND type = 'like' AND entity_type = 'post' AND entity_id = NEW.post_id
      AND is_read = false AND created_at > NOW() - AGGREGATION_WINDOW
    ORDER BY created_at DESC LIMIT 1;

    IF existing_notif_id IS NOT NULL THEN
      existing_count := COALESCE((existing_data->>'like_count')::INTEGER, 1);
      existing_recent_names := COALESCE(existing_data->'recent_liker_names', '[]'::jsonb);
      IF NOT (existing_data->'recent_liker_ids' ? liker_actor_id::TEXT) THEN
        new_count := existing_count + 1;
        new_recent_names := existing_recent_names || to_jsonb(liker_name);
        IF jsonb_array_length(new_recent_names) > 5 THEN
          new_recent_names := jsonb_path_query_array(new_recent_names, '$[1 to 5]');
        END IF;
        IF new_count = 1 THEN new_message := (new_recent_names->>0) || ' liked your business post';
        ELSIF new_count = 2 THEN new_message := (new_recent_names->>0) || ' and 1 other liked your post';
        ELSE new_message := (new_recent_names->>0) || ' and ' || (new_count - 1) || ' others liked your post';
        END IF;
        BEGIN
          UPDATE public.notifications
          SET data = jsonb_build_object(
                'post_id', NEW.post_id,
                'like_count', new_count,
                'recent_liker_ids',
                  COALESCE(existing_data->'recent_liker_ids', '[]'::jsonb) || to_jsonb(liker_actor_id::TEXT),
                'recent_liker_names', new_recent_names,
                'actor_type', liker_actor_type,
                'actor_id', liker_actor_id,
                'actor_name', liker_name,
                'actor_avatar_url', liker_avatar
              ) || v_round,
              message = new_message,
              actor_id = liker_user_id,
              updated_at = NOW()
          WHERE id = existing_notif_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END IF;
    ELSE
      BEGIN
        INSERT INTO public.notifications (
          user_id, recipient_actor_id, recipient_actor_type, actor_id,
          type, title, message, entity_type, entity_id, data, is_read, read
        ) VALUES (
          v_anchor_user_id, recipient_actor_id_val, recipient_actor_type_val, liker_user_id,
          'like', 'New like', liker_name || ' liked your business post', 'post', NEW.post_id,
          jsonb_build_object(
            'post_id', NEW.post_id,
            'like_count', 1,
            'recent_liker_ids', jsonb_build_array(liker_actor_id::TEXT),
            'recent_liker_names', jsonb_build_array(liker_name),
            'actor_type', liker_actor_type,
            'actor_id', liker_actor_id,
            'actor_name', liker_name,
            'actor_avatar_url', liker_avatar
          ) || v_round,
          false, false
        );
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- 2. COMMENTS AND REPLIES - public.comments_v2_notify()
--    Deployed body, unchanged except v_round (computed whenever the comment's
--    target is a ROUND POST, including on a reply to a comment on that post)
--    appended to the single data payload.
-- ---------------------------------------------------------------------
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
  ELSE
    RETURN NEW;  -- editorial top-level: platform content, no recipient
  END IF;

  -- A COMMENT ON A ROUND CARRIES THE ROUND, so the tap opens /round/:id with
  -- its comments instead of bouncing through /post/:id. Resolved from the
  -- comment's TARGET, so a reply under a round post carries it too.
  IF NEW.target_type = 'post' AND public.post_is_round(NEW.target_id) THEN
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
  -- 6) entity mapping (deep-link parity with old types)
  v_entity_type := CASE NEW.target_type WHEN 'post' THEN 'post'
                   WHEN 'top_ten' THEN 'top_ten' ELSE 'editorial_card' END;
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
      'course_id', CASE WHEN NEW.target_type='top_ten' THEN NEW.target_secondary_id END,
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

-- ---------------------------------------------------------------------
-- 3. MENTIONS - public.create_mention_notification()
--    Deployed body, unchanged except v_round (computed from the resolved post,
--    so a mention in a round post OR in a comment on one carries it) appended
--    to both data payloads (personal recipient, business recipient).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_mention_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_name text;
  v_business_name text;
  v_context text;
  v_context_title text;
  v_post_id uuid;
  v_comment_id uuid;
  v_review_id uuid;
  v_course_id uuid;
  v_top_ten_comment_id uuid;
  v_team_member uuid;
  v_src_actor_type text;
  v_src_actor_id uuid;
  v_round jsonb := '{}'::jsonb;   -- round fields, empty for a normal post
  v_score_id uuid;
BEGIN
  IF NEW.mentioned_type = 'user' AND NEW.mentioned_id = NEW.mentioner_id THEN
    RETURN NEW;
  END IF;

  -- A post published by a business says the BUSINESS mentioned you, not the
  -- team member who typed it. mentions carries no mentioner_type, so take the
  -- actor from the post.
  IF NEW.source_type = 'post' THEN
    SELECT actor_type, actor_id INTO v_src_actor_type, v_src_actor_id
    FROM public.posts WHERE id = NEW.source_id;
  END IF;

  IF v_src_actor_type = 'business' AND v_src_actor_id IS NOT NULL THEN
    SELECT COALESCE(name, 'A business') INTO v_actor_name
    FROM public.business_accounts WHERE id = v_src_actor_id;
  ELSE
    SELECT COALESCE(display_name, username, 'Someone') INTO v_actor_name
    FROM public.user_profiles WHERE id = NEW.mentioner_id;
  END IF;
  v_actor_name := COALESCE(v_actor_name, 'Someone');

  v_context := CASE NEW.source_type
    WHEN 'post' THEN 'a post'
    WHEN 'comment' THEN 'a comment'
    WHEN 'review' THEN 'a review'
    WHEN 'top_ten_comment' THEN 'a Top 10 comment'
  END;
  v_context_title := CASE NEW.mentioned_type
    WHEN 'user' THEN 'You were mentioned'
    ELSE 'Your business was mentioned'
  END;
  IF NEW.source_type = 'post' THEN
    v_post_id := NEW.source_id;
  ELSIF NEW.source_type = 'comment' THEN
    v_comment_id := NEW.source_id;
    SELECT post_id INTO v_post_id FROM public.post_comments WHERE id = NEW.source_id;
  ELSIF NEW.source_type = 'review' THEN
    v_review_id := NEW.source_id;
    SELECT course_id INTO v_course_id FROM public.course_ratings WHERE id = NEW.source_id;
  ELSIF NEW.source_type = 'top_ten_comment' THEN
    v_top_ten_comment_id := NEW.source_id;
  END IF;

  -- A MENTION ON A ROUND CARRIES THE ROUND.
  IF v_post_id IS NOT NULL AND public.post_is_round(v_post_id) THEN
    SELECT p.whs_score_id INTO v_score_id FROM public.posts p WHERE p.id = v_post_id;
    IF v_score_id IS NOT NULL THEN
      v_round := jsonb_build_object(
        'post_type', 'round', 'whs_score_id', v_score_id, 'is_round', true
      );
    END IF;
  END IF;

  IF NEW.mentioned_type = 'user' THEN
    BEGIN
      IF public.are_users_blocked(NEW.mentioner_id, NEW.mentioned_id) THEN RETURN NEW; END IF;
    EXCEPTION WHEN undefined_function THEN NULL; END;
    BEGIN
      INSERT INTO public.notifications (
        user_id, recipient_actor_id, recipient_actor_type, actor_id,
        type, title, message, entity_type, entity_id, data, is_read, read
      ) VALUES (
        NEW.mentioned_id, NEW.mentioned_id, 'personal', NEW.mentioner_id,
        'mention', v_context_title,
        v_actor_name || ' mentioned you in ' || v_context || '.',
        NEW.source_type, NEW.source_id,
        jsonb_build_object(
          'mention_id', NEW.id, 'source_type', NEW.source_type, 'source_id', NEW.source_id,
          'post_id', v_post_id, 'comment_id', v_comment_id,
          'review_id', v_review_id, 'course_id', v_course_id,
          'top_ten_comment_id', v_top_ten_comment_id,
          'actor_id', NEW.mentioner_id, 'actor_name', v_actor_name,
          'source_actor_type', v_src_actor_type,
          'source_actor_id', v_src_actor_id
        ) || v_round,
        false, false
      );
    EXCEPTION WHEN unique_violation THEN NULL; END;
  ELSE
    SELECT COALESCE(name, 'a business') INTO v_business_name
    FROM public.business_accounts WHERE id = NEW.mentioned_id;
    v_business_name := COALESCE(v_business_name, 'a business');
    FOR v_team_member IN
      -- business_members is AUTHORITATIVE: 31 functions and 17 RLS policies key
      -- on it, including posts.insert_posts_as_valid_actor. business_team_members
      -- is an unadopted parallel table (enum role, extra columns, no policy
      -- depends on it) and must not be read here.
      SELECT user_profile_id FROM public.business_members
      WHERE business_id = NEW.mentioned_id AND role IN ('owner', 'admin')
    LOOP
      IF v_team_member = NEW.mentioner_id THEN CONTINUE; END IF;
      BEGIN
        IF public.are_users_blocked(NEW.mentioner_id, v_team_member) THEN CONTINUE; END IF;
      EXCEPTION WHEN undefined_function THEN NULL; END;
      BEGIN
        INSERT INTO public.notifications (
          user_id, recipient_actor_id, recipient_actor_type, actor_id,
          type, title, message, entity_type, entity_id, data, is_read, read
        ) VALUES (
          v_team_member, NEW.mentioned_id, 'business', NEW.mentioner_id,
          'mention', v_context_title,
          v_actor_name || ' mentioned ' || v_business_name || ' in ' || v_context || '.',
          NEW.source_type, NEW.source_id,
          jsonb_build_object(
            'mention_id', NEW.id, 'source_type', NEW.source_type, 'source_id', NEW.source_id,
            'business_id', NEW.mentioned_id, 'business_name', v_business_name,
            'post_id', v_post_id, 'comment_id', v_comment_id,
            'review_id', v_review_id, 'course_id', v_course_id,
            'top_ten_comment_id', v_top_ten_comment_id,
            'actor_id', NEW.mentioner_id, 'actor_name', v_actor_name,
            'source_actor_type', v_src_actor_type,
            'source_actor_id', v_src_actor_id
          ) || v_round,
          false, false
        );
      EXCEPTION WHEN unique_violation THEN NULL; END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- 4. BACKFILL EXISTING ROWS
--    Counted 2026-09-15: 20 like, 9 comment, 0 mention notifications whose
--    entity is a round post, NONE of them carrying whs_score_id. new_post rows
--    (656) already carry it and are NOT touched.
-- ---------------------------------------------------------------------
DO $backfill$
DECLARE
  v_like    int;
  v_comment int;
  v_mention int;
  v_updated int;
BEGIN
  SELECT
    count(*) FILTER (WHERE n.type IN ('like','like_post')),
    count(*) FILTER (WHERE n.type IN ('comment','comment_post','comment_reply','comment_mention')),
    count(*) FILTER (WHERE n.type IN ('mention','mention_post','tag'))
  INTO v_like, v_comment, v_mention
  FROM public.notifications n
  JOIN public.posts p ON p.id = n.entity_id
  WHERE n.entity_type = 'post'
    AND p.whs_score_id IS NOT NULL
    AND n.data->>'whs_score_id' IS NULL;

  RAISE NOTICE 'backfill candidates: like=% comment=% mention=%', v_like, v_comment, v_mention;

  IF v_like <> 20 THEN
    RAISE EXCEPTION 'UNEXPECTED: % like rows to backfill, expected 20', v_like;
  END IF;
  IF v_comment <> 9 THEN
    RAISE EXCEPTION 'UNEXPECTED: % comment rows to backfill, expected 9', v_comment;
  END IF;
  IF v_mention <> 0 THEN
    RAISE EXCEPTION 'UNEXPECTED: % mention rows to backfill, expected 0', v_mention;
  END IF;

  UPDATE public.notifications n
     SET data = COALESCE(n.data, '{}'::jsonb) || jsonb_build_object(
           'post_type',    'round',
           'whs_score_id', p.whs_score_id,
           'is_round',     true
         )
    FROM public.posts p
   WHERE p.id = n.entity_id
     AND n.entity_type = 'post'
     AND p.whs_score_id IS NOT NULL
     AND n.data->>'whs_score_id' IS NULL
     AND n.type IN ('like','like_post','comment','comment_post','comment_reply',
                    'comment_mention','mention','mention_post','tag');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'backfilled % notification rows', v_updated;

  IF v_updated <> (v_like + v_comment + v_mention) THEN
    RAISE EXCEPTION 'BACKFILL MISMATCH: updated %, expected %',
      v_updated, v_like + v_comment + v_mention;
  END IF;
END
$backfill$;

-- ---------------------------------------------------------------------
-- 5. READ BACK - each rebuilt function must now carry the round fields
-- ---------------------------------------------------------------------
DO $verify$
DECLARE
  v_name text;
  v_def  text;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'create_like_notification_aggregated',
    'comments_v2_notify',
    'create_mention_notification'
  ] LOOP
    SELECT pg_get_functiondef(p.oid) INTO v_def
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = v_name;

    IF v_def IS NULL
       OR v_def NOT LIKE '%v_round%'
       OR v_def NOT LIKE '%whs_score_id%'
       OR v_def NOT LIKE '%is_round%'
       OR v_def NOT LIKE '%post_is_round%' THEN
      RAISE EXCEPTION 'VERIFY FAILED: public.% does not carry the round fields', v_name;
    END IF;
    RAISE NOTICE 'verified public.% md5=%', v_name, md5(v_def);
  END LOOP;
END
$verify$;

-- Post-state, printed for the record.
SELECT n.type,
       count(*) AS total,
       count(*) FILTER (WHERE n.data->>'whs_score_id' IS NOT NULL) AS with_score_id
  FROM public.notifications n
  JOIN public.posts p ON p.id = n.entity_id
 WHERE n.entity_type = 'post' AND p.whs_score_id IS NOT NULL
 GROUP BY 1
 ORDER BY 1;

-- THE CHECK THE BRIEF ASKED FOR: this must return 0.
SELECT count(*) AS notifications_on_a_round_without_a_score_id
  FROM public.notifications n
  JOIN public.posts p ON p.id = n.entity_id
 WHERE n.entity_type = 'post'
   AND p.whs_score_id IS NOT NULL
   AND n.data->>'whs_score_id' IS NULL;

COMMIT;
