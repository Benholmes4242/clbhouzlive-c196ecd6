
-- Retire legacy follow notification trigger (single source of truth = follows)
DROP TRIGGER IF EXISTS follow_notification_trigger ON public.user_follows;

CREATE OR REPLACE FUNCTION public.create_follow_notification_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  follower_name text;
  follower_logo text;
  business_name text;
  mgr_user_id uuid;
BEGIN
  -- Resolve follower identity by actor type
  IF NEW.follower_actor_type = 'business' THEN
    SELECT name, logo_url INTO follower_name, follower_logo
      FROM public.business_accounts
     WHERE id = NEW.follower_actor_id;
    follower_name := COALESCE(follower_name, 'A business');
  ELSE
    SELECT COALESCE(display_name, username, 'Someone'), profile_photo_url
      INTO follower_name, follower_logo
      FROM public.user_profiles
     WHERE id = NEW.follower_actor_id;
    follower_name := COALESCE(follower_name, 'Someone');
  END IF;

  -- Block + friend guards apply only to personal <-> personal
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
    -- Personal target: notify that user
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
          -- mirrored keys so existing client renderer picks up business identity
          'actor_type', NEW.follower_actor_type,
          'actor_name', follower_name,
          'actor_avatar_url', follower_logo
        )
      )
      ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
  ELSE
    -- Business target: fan out to every manager (owner/admin/editor)
    SELECT name INTO business_name
      FROM public.business_accounts
     WHERE id = NEW.following_actor_id;
    business_name := COALESCE(business_name, 'your business');

    FOR mgr_user_id IN
      SELECT user_profile_id
        FROM public.business_members
       WHERE business_id = NEW.following_actor_id
         AND role IN ('owner', 'admin', 'editor')
    LOOP
      BEGIN
        INSERT INTO public.notifications (
          user_id, recipient_actor_type, recipient_actor_id, actor_id,
          type, title, message, entity_type, entity_id, data
        ) VALUES (
          mgr_user_id, 'business', NEW.following_actor_id, NEW.follower_user_id,
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
            -- mirrored keys for existing renderer
            'actor_type', NEW.follower_actor_type,
            'actor_name', follower_name,
            'actor_avatar_url', follower_logo
          )
        )
        ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_follow_notification ON public.follows;
CREATE TRIGGER trg_follow_notification
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification_v2();
