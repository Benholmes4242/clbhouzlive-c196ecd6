# Top-ten comment notifications — DB trigger (record)

**Status: applied manually by Ben on 2026-07-08 — do not re-run.**

Ports the top-ten comment / reply notification path off the client
(`useTopTenComments.ts` L130 / L152) onto a server-side trigger, matching
the fix applied to `post_comments` earlier the same day.

Same root cause: bare `.insert()` into `public.notifications` silently
lost `23505 unique_violation` collisions against
`idx_notifications_dedup (user_id, type, actor_id, entity_id)` because
`entity_id = course_id` for both types — repeat interactions on the same
Top-10 slot dropped instead of bumping.

## Behaviour parity (from L130 / L152)

- Top-level (`parent_id IS NULL`) → `type='top_ten_comment'` to
  `target_user_id` (Top-10 list owner), self-guard on commenter.
- Reply (`parent_id IS NOT NULL`) → `type='top_ten_reply'` to
  `parent.commenter_id`, self-guard on commenter.

Both entities: `entity_type='top_ten'`, `entity_id=course_id`. Deep-link
payload adds `comment_id` (and `parent_comment_id` when set) so a bumped
row still lands on the newest comment.

## Guards added centrally

- Self-guard (commenter is recipient).
- `user_blocks` both directions.
- Stripped mention preview using `@\1` for parity with client
  `stripMentionMarkup`, truncated to 60 chars + ellipsis.

## Intentional behaviour — documented

`ON CONFLICT ... DO UPDATE` refreshes message/title/data and re-unreads
the in-app row (`is_read=false`, `read=false`, `is_deleted=false`), but
does **not** re-fire `on_notification_auto_queue_push` (that trigger is
`AFTER INSERT` only). Desired anti-spam behaviour: one push per
`(recipient, actor, course)` burst.

## Migration body

```sql
CREATE OR REPLACE FUNCTION public.create_top_ten_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_uid   UUID;
  v_type            TEXT;
  v_title_suffix    TEXT;
  v_actor_name      TEXT;
  v_actor_avatar    TEXT;
  v_preview         TEXT;
  v_parent_commenter UUID;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT commenter_id INTO v_parent_commenter
      FROM public.top_ten_comments
     WHERE id = NEW.parent_id;
    IF v_parent_commenter IS NULL THEN
      RETURN NEW;
    END IF;
    v_recipient_uid := v_parent_commenter;
    v_type          := 'top_ten_reply';
    v_title_suffix  := ' replied to your comment';
  ELSE
    v_recipient_uid := NEW.target_user_id;
    v_type          := 'top_ten_comment';
    v_title_suffix  := ' commented on your Top 10';
  END IF;

  IF v_recipient_uid = NEW.commenter_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_blocks
     WHERE (blocker_id = v_recipient_uid AND blocked_id = NEW.commenter_id)
        OR (blocker_id = NEW.commenter_id AND blocked_id = v_recipient_uid)
  ) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(up.display_name, up.username, 'Someone'),
         up.profile_photo_url
    INTO v_actor_name, v_actor_avatar
    FROM public.user_profiles up
   WHERE up.id = NEW.commenter_id;

  v_actor_name := COALESCE(v_actor_name, 'Someone');

  v_preview := regexp_replace(
    COALESCE(NEW.body, ''),
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
    v_recipient_uid, 'personal', v_recipient_uid,
    NEW.commenter_id, v_type,
    v_actor_name || v_title_suffix,
    v_preview,
    'top_ten', NEW.course_id, FALSE, FALSE,
    jsonb_build_object(
      'target_user_id',    NEW.target_user_id,
      'course_id',         NEW.course_id,
      'comment_id',        NEW.id,
      'parent_comment_id', NEW.parent_id,
      'actor_name',        v_actor_name,
      'actor_avatar',      v_actor_avatar
    )
  )
  ON CONFLICT (user_id, type, actor_id, entity_id) DO UPDATE
    SET message    = EXCLUDED.message,
        title      = EXCLUDED.title,
        data       = EXCLUDED.data,
        is_read    = FALSE,
        read       = FALSE,
        is_deleted = FALSE,
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_top_ten_comments_create_notification ON public.top_ten_comments;

CREATE TRIGGER trg_top_ten_comments_create_notification
AFTER INSERT ON public.top_ten_comments
FOR EACH ROW
EXECUTE FUNCTION public.create_top_ten_comment_notification();
```
