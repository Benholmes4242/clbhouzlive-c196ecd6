
-- ============================================================================
-- Business notifications: ONE shared row per event (Option B1)
-- Anchor user_id to a deterministic manager (owner > admin > lowest id).
-- Push fan-out already keys on recipient_actor_id, so a single row suffices.
-- ============================================================================

-- 1) FOLLOW notification trigger
CREATE OR REPLACE FUNCTION public.create_follow_notification_v2()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  follower_name text;
  follower_logo text;
  business_name text;
  v_anchor_user_id uuid;
BEGIN
  IF NEW.follower_actor_type = 'business' THEN
    SELECT name, logo_url INTO follower_name, follower_logo
      FROM public.business_accounts WHERE id = NEW.follower_actor_id;
    follower_name := COALESCE(follower_name, 'A business');
  ELSE
    SELECT COALESCE(display_name, username, 'Someone'), profile_photo_url
      INTO follower_name, follower_logo
      FROM public.user_profiles WHERE id = NEW.follower_actor_id;
    follower_name := COALESCE(follower_name, 'Someone');
  END IF;

  IF NEW.follower_actor_type = 'personal' AND NEW.following_actor_type = 'personal' THEN
    IF public.are_users_blocked(NEW.follower_actor_id, NEW.following_actor_id) THEN
      RETURN NEW;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.user_friends
       WHERE status = 'accepted'
         AND ((user_id = NEW.follower_actor_id AND friend_id = NEW.following_actor_id)
           OR (user_id = NEW.following_actor_id AND friend_id = NEW.follower_actor_id))
    ) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.following_actor_type = 'personal' THEN
    BEGIN
      INSERT INTO public.notifications (
        user_id, recipient_actor_type, recipient_actor_id, actor_id,
        type, title, message, entity_type, entity_id, data
      ) VALUES (
        NEW.following_actor_id, 'personal', NEW.following_actor_id, NEW.follower_user_id,
        'follow', 'New Follower', follower_name || ' started following you',
        'follow', NEW.id,
        jsonb_build_object(
          'follower_actor_type', NEW.follower_actor_type,
          'follower_actor_id', NEW.follower_actor_id,
          'follower_name', follower_name,
          'follower_avatar_url', follower_logo,
          'actor_type', NEW.follower_actor_type,
          'actor_name', follower_name,
          'actor_avatar_url', follower_logo
        )
      )
      ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
  ELSE
    -- Business target: ONE shared row anchored to a deterministic manager
    SELECT name INTO business_name
      FROM public.business_accounts WHERE id = NEW.following_actor_id;
    business_name := COALESCE(business_name, 'your business');

    SELECT user_profile_id INTO v_anchor_user_id
      FROM public.business_members
     WHERE business_id = NEW.following_actor_id
       AND role IN ('owner','admin','editor')
     ORDER BY (role='owner') DESC, (role='admin') DESC, user_profile_id ASC
     LIMIT 1;

    IF v_anchor_user_id IS NULL THEN
      RETURN NEW;
    END IF;

    BEGIN
      INSERT INTO public.notifications (
        user_id, recipient_actor_type, recipient_actor_id, actor_id,
        type, title, message, entity_type, entity_id, data
      ) VALUES (
        v_anchor_user_id, 'business', NEW.following_actor_id, NEW.follower_user_id,
        'follow', 'New Follower',
        follower_name || ' started following ' || business_name,
        'follow', NEW.id,
        jsonb_build_object(
          'follower_actor_type', NEW.follower_actor_type,
          'follower_actor_id', NEW.follower_actor_id,
          'follower_name', follower_name,
          'follower_avatar_url', follower_logo,
          'business_id', NEW.following_actor_id,
          'business_name', business_name,
          'actor_type', NEW.follower_actor_type,
          'actor_name', follower_name,
          'actor_avatar_url', follower_logo
        )
      )
      ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) LIKE notification trigger (only business branch changed)
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
BEGIN
  SELECT user_id, actor_id, actor_type, id
  INTO post_record
  FROM public.posts WHERE id = NEW.post_id;

  IF post_record IS NULL THEN RETURN NEW; END IF;

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
        IF new_count = 1 THEN new_message := 'liked your post';
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
              ),
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
          'like', 'New like', 'liked your post', 'post', NEW.post_id,
          jsonb_build_object(
            'post_id', NEW.post_id,
            'like_count', 1,
            'recent_liker_ids', jsonb_build_array(liker_actor_id::TEXT),
            'recent_liker_names', jsonb_build_array(liker_name),
            'actor_type', liker_actor_type,
            'actor_id', liker_actor_id,
            'actor_name', liker_name,
            'actor_avatar_url', liker_avatar
          ),
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
        IF new_count = 1 THEN new_message := 'liked your post';
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
              ),
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
          'like', 'New like', 'liked your business post', 'post', NEW.post_id,
          jsonb_build_object(
            'post_id', NEW.post_id,
            'like_count', 1,
            'recent_liker_ids', jsonb_build_array(liker_actor_id::TEXT),
            'recent_liker_names', jsonb_build_array(liker_name),
            'actor_type', liker_actor_type,
            'actor_id', liker_actor_id,
            'actor_name', liker_name,
            'actor_avatar_url', liker_avatar
          ),
          false, false
        );
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) COMMENT MENTION trigger (business branch becomes single row)
CREATE OR REPLACE FUNCTION public.create_comment_mention_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  comment_record RECORD;
  mentioner_name TEXT;
  v_anchor_user_id UUID;
BEGIN
  IF NEW.mentioned_entity_type NOT IN ('user', 'business') THEN
    RETURN NEW;
  END IF;

  SELECT pc.user_id AS commenter_user_id, pc.post_id, pc.id AS comment_id
  INTO comment_record
  FROM public.post_comments pc WHERE pc.id = NEW.comment_id;

  IF comment_record IS NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(display_name, username, 'Someone') INTO mentioner_name
  FROM public.user_profiles WHERE id = comment_record.commenter_user_id;

  IF NEW.mentioned_entity_type = 'user' THEN
    IF NEW.mentioned_entity_id = comment_record.commenter_user_id THEN RETURN NEW; END IF;
    IF are_users_blocked(comment_record.commenter_user_id, NEW.mentioned_entity_id) THEN RETURN NEW; END IF;

    BEGIN
      INSERT INTO public.notifications (
        user_id, recipient_actor_id, recipient_actor_type, actor_id,
        type, title, message, entity_type, entity_id, data, is_read, read
      ) VALUES (
        NEW.mentioned_entity_id, NEW.mentioned_entity_id, 'personal',
        comment_record.commenter_user_id,
        'comment_mention', 'Mentioned you',
        mentioner_name || ' mentioned you in a comment',
        'comment', NEW.comment_id,
        jsonb_build_object(
          'post_id', comment_record.post_id,
          'comment_id', NEW.comment_id,
          'mentioned_username', NEW.mentioned_username
        ),
        false, false
      );
    EXCEPTION WHEN unique_violation THEN NULL;
    END;

  ELSIF NEW.mentioned_entity_type = 'business' THEN
    SELECT user_profile_id INTO v_anchor_user_id
      FROM public.business_members
     WHERE business_id = NEW.mentioned_entity_id
       AND role IN ('owner','admin')
     ORDER BY (role='owner') DESC, (role='admin') DESC, user_profile_id ASC
     LIMIT 1;

    IF v_anchor_user_id IS NULL THEN RETURN NEW; END IF;
    IF v_anchor_user_id = comment_record.commenter_user_id THEN RETURN NEW; END IF;
    IF are_users_blocked(comment_record.commenter_user_id, v_anchor_user_id) THEN RETURN NEW; END IF;

    BEGIN
      INSERT INTO public.notifications (
        user_id, recipient_actor_id, recipient_actor_type, actor_id,
        type, title, message, entity_type, entity_id, data, is_read, read
      ) VALUES (
        v_anchor_user_id, NEW.mentioned_entity_id, 'business',
        comment_record.commenter_user_id,
        'comment_mention', 'Mentioned your business',
        mentioner_name || ' mentioned your business in a comment',
        'comment', NEW.comment_id,
        jsonb_build_object(
          'post_id', comment_record.post_id,
          'comment_id', NEW.comment_id,
          'business_id', NEW.mentioned_entity_id,
          'mentioned_username', NEW.mentioned_username
        ),
        false, false
      );
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4) Clean up existing duplicate business notification rows
-- Keep one per (recipient_actor_id, type, actor_id, entity_id); delete the rest.
DELETE FROM public.notifications a
USING public.notifications b
WHERE a.ctid < b.ctid
  AND a.recipient_actor_type = 'business'
  AND b.recipient_actor_type = 'business'
  AND a.recipient_actor_id = b.recipient_actor_id
  AND a.type = b.type
  AND a.actor_id IS NOT DISTINCT FROM b.actor_id
  AND a.entity_id IS NOT DISTINCT FROM b.entity_id;
