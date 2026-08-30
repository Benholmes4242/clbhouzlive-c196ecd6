CREATE OR REPLACE FUNCTION public.create_new_post_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_name text;
  v_follower   uuid;
  v_is_round   boolean;
  v_message    text;
BEGIN
  -- THE POST IS THE FACT. A notification is a courtesy about that fact.
  -- A courtesy that cannot be delivered is never a reason for the fact not
  -- to exist. Every per-follower insert below is therefore wrapped in a
  -- catch-all handler: one unnotifiable follower (an orphaned follows row
  -- pointing at a deleted account violating notifications_user_fk, for
  -- example) must not abort the other followers, and must never roll back
  -- the post insert that fired this trigger. Aug 2026: a single orphan did
  -- exactly that, discarding seven round posts on every cron run for two
  -- days. Swallowed failures are logged -- silent ones are how that went
  -- unnoticed.
  IF NEW.actor_type = 'business' AND NEW.actor_id IS NOT NULL THEN
    SELECT COALESCE(name, 'A business') INTO v_actor_name
    FROM public.business_accounts WHERE id = NEW.actor_id;
  ELSE
    SELECT COALESCE(display_name, username, 'Someone') INTO v_actor_name
    FROM public.user_profiles WHERE id = NEW.user_id;
  END IF;
  v_actor_name := COALESCE(v_actor_name, 'Someone');

  -- A ROUND POST IS NOT A POST TO A MEMBER. It is auto-created when a round
  -- syncs, has no caption and no media, and the thing worth opening is the
  -- scorecard -- not a media viewer that will refuse a media-less post.
  v_is_round := NEW.post_type = 'round' AND NEW.whs_score_id IS NOT NULL;
  v_message := v_actor_name || CASE WHEN v_is_round
                                    THEN ' shared a round.'
                                    ELSE ' shared a new post.' END;

  FOR v_follower IN
    SELECT f.follower_actor_id
    FROM public.follows f
    WHERE f.following_actor_type = COALESCE(NEW.actor_type, 'personal')
      AND f.following_actor_id   = COALESCE(NEW.actor_id, NEW.user_id)
      AND f.follower_actor_type  = 'personal'
  LOOP
    CONTINUE WHEN v_follower = NEW.user_id;

    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.notification_preferences np
      WHERE np.user_id = v_follower
        AND np.muted_types IS NOT NULL
        AND 'new_post' = ANY(np.muted_types)
    );

    BEGIN
      IF public.are_users_blocked(NEW.user_id, v_follower) THEN CONTINUE; END IF;
    EXCEPTION WHEN undefined_function THEN NULL; END;

    BEGIN
      INSERT INTO public.notifications (
        user_id, recipient_actor_id, recipient_actor_type, actor_id,
        type, title, message, entity_type, entity_id, data, is_read, read
      ) VALUES (
        v_follower, v_follower, 'personal', NEW.user_id,
        'new_post',
        CASE WHEN v_is_round THEN 'New round' ELSE 'New post' END,
        v_message,
        'post', NEW.id,
        jsonb_build_object(
          'post_id', NEW.id, 'actor_id', NEW.user_id, 'actor_name', v_actor_name,
          'source_actor_type', NEW.actor_type, 'source_actor_id', NEW.actor_id,
          'post_type', NEW.post_type,
          'whs_score_id', NEW.whs_score_id,
          'is_round', v_is_round
        ),
        false, false
      );
    EXCEPTION
      WHEN unique_violation THEN
        -- Already notified for this (recipient, type, actor, post). Expected.
        NULL;
      WHEN OTHERS THEN
        -- Log and carry on to the next follower. Never re-raise.
        BEGIN
          INSERT INTO public.analytics_events (name, user_id, props)
          VALUES (
            'post_notification_failure',
            NEW.user_id,
            jsonb_build_object(
              'post_id',      NEW.id,
              'post_type',    NEW.post_type,
              'author_id',    NEW.user_id,
              'follower_id',  v_follower,
              'actor_type',   COALESCE(NEW.actor_type, 'personal'),
              'actor_id',     COALESCE(NEW.actor_id, NEW.user_id),
              'notification_type', 'new_post',
              'sqlstate',     SQLSTATE,
              'sqlerrm',      SQLERRM
            )
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        RAISE WARNING 'create_new_post_notifications skipped follower=% post=% sqlstate=% sqlerrm=%',
          v_follower, NEW.id, SQLSTATE, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$function$;