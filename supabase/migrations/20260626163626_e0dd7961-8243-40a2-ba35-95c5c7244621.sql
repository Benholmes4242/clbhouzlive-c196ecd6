CREATE OR REPLACE FUNCTION public.create_comment_mention_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  comment_record RECORD;
  mentioner_name TEXT;
  business_team_id UUID;
BEGIN
  IF NEW.mentioned_entity_type NOT IN ('user', 'business') THEN
    RETURN NEW;
  END IF;

  SELECT pc.user_id AS commenter_user_id, pc.post_id, pc.id AS comment_id
  INTO comment_record
  FROM public.post_comments pc
  WHERE pc.id = NEW.comment_id;

  IF comment_record IS NULL THEN
    RAISE NOTICE 'create_comment_mention_notification: comment % not found, skipping', NEW.comment_id;
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username, 'Someone') INTO mentioner_name
  FROM public.user_profiles
  WHERE id = comment_record.commenter_user_id;

  IF NEW.mentioned_entity_type = 'user' THEN
    IF NEW.mentioned_entity_id = comment_record.commenter_user_id THEN
      RETURN NEW;
    END IF;

    IF are_users_blocked(comment_record.commenter_user_id, NEW.mentioned_entity_id) THEN
      RETURN NEW;
    END IF;

    BEGIN
      INSERT INTO public.notifications (
        user_id, recipient_actor_id, recipient_actor_type, actor_id,
        type, title, message, entity_type, entity_id, data, is_read, read
      )
      VALUES (
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
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;

  ELSIF NEW.mentioned_entity_type = 'business' THEN
    FOR business_team_id IN
      SELECT user_profile_id
      FROM public.business_members
      WHERE business_id = NEW.mentioned_entity_id
        AND role IN ('owner', 'admin')
    LOOP
      IF business_team_id = comment_record.commenter_user_id THEN
        CONTINUE;
      END IF;

      IF are_users_blocked(comment_record.commenter_user_id, business_team_id) THEN
        CONTINUE;
      END IF;

      BEGIN
        INSERT INTO public.notifications (
          user_id, recipient_actor_id, recipient_actor_type, actor_id,
          type, title, message, entity_type, entity_id, data, is_read, read
        )
        VALUES (
          business_team_id, NEW.mentioned_entity_id, 'business',
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
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;