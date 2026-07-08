# Comment notifications — DB trigger (record)

**Status: applied manually by Ben on 2026-07-08 — do not re-run.**

Restores comment notifications after a six-month silent outage caused by
the client-side `.insert()` in `useCommentsWithReplies.ts` /
`usePostEngagement.ts` swallowing `23505 unique_violation` errors against
`idx_notifications_dedup (user_id, type, actor_id, entity_id)`.

The trigger writes on the server, uses `ON CONFLICT ... DO UPDATE` to bump
the existing notification on repeat comments, and enforces the
self-comment and blocked-users guards centrally.

## Corrections applied vs assistant draft

Ben corrected two things before running:

1. `user_profiles.avatar_url` does not exist → use `profile_photo_url`.
   The draft would have failed on every personal comment.
2. The mirror boolean `read` is set alongside `is_read` in both branches
   for parity with the mentions trigger.

## Intentional behaviour — documented

The `DO UPDATE` branch does **not** fire
`on_notification_auto_queue_push` (that trigger is `AFTER INSERT` only),
so repeat comments from the same actor on the same post re-unread the
in-app row **without** generating a new push. This is desired anti-spam
behaviour: one push per `(recipient, actor, post)` burst.

## Migration body

Below is the assistant's original SQL; the live version differs only by
the two corrections above.

```sql
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_type_actor_entity_key;

CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post           RECORD;
  v_recipient_uid  UUID;
  v_recipient_atyp TEXT;
  v_recipient_aid  UUID;
  v_actor_user_id  UUID;
  v_actor_name     TEXT;
  v_actor_avatar   TEXT;
  v_preview        TEXT;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.user_id, p.actor_type, p.actor_id
    INTO v_post
    FROM public.posts p
   WHERE p.id = NEW.post_id;

  IF NOT FOUND OR v_post.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_recipient_uid  := v_post.user_id;
  v_recipient_atyp := COALESCE(v_post.actor_type, 'personal');
  v_recipient_aid  := COALESCE(v_post.actor_id, v_post.user_id);
  v_actor_user_id  := NEW.user_id;

  IF (COALESCE(NEW.actor_type, 'personal') = v_recipient_atyp
      AND COALESCE(NEW.actor_id, NEW.user_id) = v_recipient_aid) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_blocks
     WHERE (blocker_id = v_recipient_uid AND blocked_id = v_actor_user_id)
        OR (blocker_id = v_actor_user_id AND blocked_id = v_recipient_uid)
  ) THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.actor_type, 'personal') = 'business' THEN
    SELECT b.name, b.logo_url
      INTO v_actor_name, v_actor_avatar
      FROM public.business_accounts b
     WHERE b.id = NEW.actor_id;
  ELSE
    SELECT COALESCE(up.display_name, up.username, 'Someone'),
           up.profile_photo_url            -- corrected: avatar_url does not exist
      INTO v_actor_name, v_actor_avatar
      FROM public.user_profiles up
     WHERE up.id = v_actor_user_id;
  END IF;

  v_actor_name := COALESCE(v_actor_name, 'Someone');

  -- Strip mention markup to '@Display Name' (parity with client
  -- stripMentionMarkup helper), then truncate.
  v_preview := regexp_replace(
    COALESCE(NEW.content, ''),
    '@\[([^\]]+)\]\((u|b):[0-9a-fA-F-]{36}\)',
    '@\1',
    'g'
  );
  IF length(v_preview) > 60 THEN
    v_preview := left(v_preview, 60) || '…';
  END IF;

  INSERT INTO public.notifications (
    user_id, recipient_actor_type, recipient_actor_id,
    actor_id, type, title, message,
    entity_type, entity_id, is_read, read, data
  ) VALUES (
    v_recipient_uid, v_recipient_atyp, v_recipient_aid,
    v_actor_user_id, 'comment',
    v_actor_name || ' commented on your post',
    v_preview,
    'post', NEW.post_id, FALSE, FALSE,
    jsonb_build_object(
      'post_id',              NEW.post_id,
      'comment_id',           NEW.id,
      'commenter_actor_type', COALESCE(NEW.actor_type, 'personal'),
      'commenter_actor_id',   COALESCE(NEW.actor_id, NEW.user_id),
      'actor_name',           v_actor_name,
      'actor_avatar',         v_actor_avatar
    )
  )
  ON CONFLICT (user_id, type, actor_id, entity_id) DO UPDATE
    SET message    = EXCLUDED.message,
        title      = EXCLUDED.title,
        data       = EXCLUDED.data,
        is_read    = FALSE,
        read       = FALSE,       -- parity with is_read
        is_deleted = FALSE,
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comments_create_notification ON public.post_comments;

CREATE TRIGGER trg_post_comments_create_notification
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.create_comment_notification();
```
