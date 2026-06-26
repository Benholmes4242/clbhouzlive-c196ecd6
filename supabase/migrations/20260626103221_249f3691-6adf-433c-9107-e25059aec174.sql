-- Update like-notification triggers so the acting actor (business or personal)
-- is recorded as the notifications.actor_id and used for display.

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
  business_team_id UUID;
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
  FROM public.posts
  WHERE id = NEW.post_id;

  IF post_record IS NULL THEN
    RETURN NEW;
  END IF;

  liker_user_id := NEW.user_id;
  liker_actor_type := COALESCE(NEW.actor_type, 'personal');
  liker_actor_id := COALESCE(NEW.actor_id, NEW.user_id);

  IF liker_actor_type = 'business' THEN
    SELECT name, logo_url INTO liker_name, liker_avatar
    FROM public.business_accounts
    WHERE id = liker_actor_id;
  ELSE
    SELECT COALESCE(display_name, username, 'Someone'), profile_photo_url
      INTO liker_name, liker_avatar
    FROM public.user_profiles
    WHERE id = liker_user_id;
  END IF;

  IF liker_name IS NULL THEN
    liker_name := 'Someone';
  END IF;

  IF post_record.actor_type = 'personal' THEN
    recipient_user_id := post_record.user_id;
    recipient_actor_id_val := post_record.actor_id;
    recipient_actor_type_val := 'personal';

    -- Self-like guard (personal post)
    IF liker_actor_type = 'personal' AND liker_user_id = recipient_user_id THEN
      RETURN NEW;
    END IF;

    IF are_users_blocked(liker_user_id, recipient_user_id) THEN
      RETURN NEW;
    END IF;

    SELECT id, data INTO existing_notif_id, existing_data
    FROM public.notifications
    WHERE recipient_actor_id = recipient_actor_id_val
      AND recipient_actor_type = recipient_actor_type_val
      AND type = 'like'
      AND entity_type = 'post'
      AND entity_id = NEW.post_id
      AND is_read = false
      AND created_at > NOW() - AGGREGATION_WINDOW
    ORDER BY created_at DESC
    LIMIT 1;

    IF existing_notif_id IS NOT NULL THEN
      existing_count := COALESCE((existing_data->>'like_count')::INTEGER, 1);
      existing_recent_names := COALESCE(existing_data->'recent_liker_names', '[]'::jsonb);

      IF NOT (existing_data->'recent_liker_ids' ? liker_actor_id::TEXT) THEN
        new_count := existing_count + 1;
        new_recent_names := existing_recent_names || to_jsonb(liker_name);
        IF jsonb_array_length(new_recent_names) > 5 THEN
          new_recent_names := jsonb_path_query_array(new_recent_names, '$[1 to 5]');
        END IF;

        IF new_count = 1 THEN
          new_message := 'liked your post';
        ELSIF new_count = 2 THEN
          new_message := (new_recent_names->>0) || ' and 1 other liked your post';
        ELSE
          new_message := (new_recent_names->>0) || ' and ' || (new_count - 1) || ' others liked your post';
        END IF;

        UPDATE public.notifications
        SET
          data = jsonb_build_object(
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
          actor_id = liker_actor_id,
          updated_at = NOW()
        WHERE id = existing_notif_id;
      END IF;
    ELSE
      INSERT INTO public.notifications (
        user_id, recipient_actor_id, recipient_actor_type, actor_id,
        type, title, message, entity_type, entity_id, data, is_read, read
      )
      VALUES (
        recipient_user_id, recipient_actor_id_val, recipient_actor_type_val, liker_actor_id,
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
    END IF;

  ELSIF post_record.actor_type = 'business' THEN
    recipient_actor_id_val := post_record.actor_id;
    recipient_actor_type_val := 'business';

    -- Self-like guard (business acting on its own post)
    IF liker_actor_type = 'business' AND liker_actor_id = post_record.actor_id THEN
      RETURN NEW;
    END IF;

    FOR business_team_id IN
      SELECT user_profile_id
      FROM public.business_members
      WHERE business_id = post_record.actor_id
        AND role IN ('owner', 'admin')
    LOOP
      IF business_team_id = liker_user_id AND liker_actor_type = 'personal' THEN
        CONTINUE;
      END IF;

      IF are_users_blocked(liker_user_id, business_team_id) THEN
        CONTINUE;
      END IF;

      SELECT id, data INTO existing_notif_id, existing_data
      FROM public.notifications
      WHERE user_id = business_team_id
        AND recipient_actor_id = recipient_actor_id_val
        AND recipient_actor_type = recipient_actor_type_val
        AND type = 'like'
        AND entity_type = 'post'
        AND entity_id = NEW.post_id
        AND is_read = false
        AND created_at > NOW() - AGGREGATION_WINDOW
      ORDER BY created_at DESC
      LIMIT 1;

      IF existing_notif_id IS NOT NULL THEN
        existing_count := COALESCE((existing_data->>'like_count')::INTEGER, 1);
        existing_recent_names := COALESCE(existing_data->'recent_liker_names', '[]'::jsonb);

        IF NOT (existing_data->'recent_liker_ids' ? liker_actor_id::TEXT) THEN
          new_count := existing_count + 1;
          new_recent_names := existing_recent_names || to_jsonb(liker_name);
          IF jsonb_array_length(new_recent_names) > 5 THEN
            new_recent_names := jsonb_path_query_array(new_recent_names, '$[1 to 5]');
          END IF;

          IF new_count = 1 THEN
            new_message := 'liked your post';
          ELSIF new_count = 2 THEN
            new_message := (new_recent_names->>0) || ' and 1 other liked your post';
          ELSE
            new_message := (new_recent_names->>0) || ' and ' || (new_count - 1) || ' others liked your post';
          END IF;

          UPDATE public.notifications
          SET
            data = jsonb_build_object(
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
            actor_id = liker_actor_id,
            updated_at = NOW()
          WHERE id = existing_notif_id;
        END IF;
      ELSE
        INSERT INTO public.notifications (
          user_id, recipient_actor_id, recipient_actor_type, actor_id,
          type, title, message, entity_type, entity_id, data, is_read, read
        )
        VALUES (
          business_team_id, recipient_actor_id_val, recipient_actor_type_val, liker_actor_id,
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
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- Patch the unused legacy single-like notification function so that, if ever re-wired,
-- it also resolves the acting actor (business or personal) rather than always the personal user.
CREATE OR REPLACE FUNCTION public.create_like_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  post_owner_id UUID;
  post_owner_actor_id UUID;
  post_owner_actor_type TEXT;
  liker_actor_type TEXT;
  liker_actor_id UUID;
  liker_name TEXT;
  liker_avatar TEXT;
  post_content_preview TEXT;
  course_name TEXT;
BEGIN
  SELECT user_id, actor_id, actor_type
    INTO post_owner_id, post_owner_actor_id, post_owner_actor_type
  FROM public.posts
  WHERE id = NEW.post_id;

  liker_actor_type := COALESCE(NEW.actor_type, 'personal');
  liker_actor_id   := COALESCE(NEW.actor_id, NEW.user_id);

  -- Self-like guard, actor-aware
  IF (liker_actor_type = 'personal' AND post_owner_id = NEW.user_id)
     OR (liker_actor_type = 'business' AND post_owner_actor_type = 'business' AND post_owner_actor_id = liker_actor_id) THEN
    RETURN NEW;
  END IF;

  IF liker_actor_type = 'business' THEN
    SELECT name, logo_url INTO liker_name, liker_avatar
    FROM public.business_accounts WHERE id = liker_actor_id;
  ELSE
    SELECT COALESCE(display_name, username, 'Someone'), profile_photo_url
      INTO liker_name, liker_avatar
    FROM public.user_profiles WHERE id = NEW.user_id;
  END IF;
  liker_name := COALESCE(liker_name, 'Someone');

  SELECT LEFT(COALESCE(content, ''), 50) INTO post_content_preview
  FROM public.posts WHERE id = NEW.post_id;

  SELECT gc.name INTO course_name
  FROM public.post_tags pt
  JOIN public.taggable_entities te ON pt.tagged_entity_id = te.id
  JOIN public.golf_courses gc ON te.entity_id = gc.id
  WHERE pt.post_id = NEW.post_id AND te.entity_type = 'course'
  LIMIT 1;

  PERFORM public.send_push_notification(
    post_owner_id,
    'like',
    'Post Liked',
    CASE
      WHEN course_name IS NOT NULL THEN
        liker_name || ' liked your Moment at ' || course_name || '.'
      ELSE
        liker_name || ' liked your post.'
    END,
    jsonb_build_object(
      'post_id', NEW.post_id,
      'liker_id', liker_actor_id,
      'liker_name', liker_name,
      'actor_type', liker_actor_type,
      'actor_id', liker_actor_id,
      'actor_name', liker_name,
      'actor_avatar_url', liker_avatar,
      'content_preview', post_content_preview,
      'course_name', course_name
    )
  );

  RETURN NEW;
END;
$function$;