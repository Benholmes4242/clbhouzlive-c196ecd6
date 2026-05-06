-- ============================================================================
-- Fix: friend-request acceptance failing with 42P10 (no unique or exclusion
-- constraint matching the ON CONFLICT specification).
--
-- Root cause: migration 20260501103242 changed the friend-notification triggers
-- to use ON CONFLICT (user_id, type, actor_id, entity_id), assuming
-- idx_notifications_dedup covered those columns. It does not — that index is
-- on (user_id, type, actor_id, notifications_minute_bucket(created_at)) and
-- is partial (WHERE actor_id IS NOT NULL), so column-list inference can never
-- match it.
--
-- Long-term fix: introduce a real named UNIQUE CONSTRAINT keyed on the actual
-- semantic identity of a notification — (user_id, type, actor_id, entity_id) —
-- and switch the triggers to ON CONFLICT ON CONSTRAINT <name>. Most robust
-- form: immune to future partial-index changes and column reordering, plays
-- well with PostgREST upserts.
--
-- The existing partial index idx_notifications_dedup is left in place — it
-- still provides per-minute spam protection for other notification flows.
--
-- This migration is idempotent — every step is guarded so re-applying against
-- prod (where the constraint and updated functions already exist) is a no-op.
-- ============================================================================

-- 1. Dedup any rows that would block the new constraint.
--    Only runs if the constraint doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass
      AND conname = 'notifications_recipient_type_actor_entity_key'
  ) THEN
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY user_id, type, actor_id, entity_id
          ORDER BY created_at ASC, id ASC
        ) AS rn
      FROM notifications
      WHERE actor_id IS NOT NULL
        AND entity_id IS NOT NULL
    )
    DELETE FROM notifications n
    USING ranked r
    WHERE n.id = r.id
      AND r.rn > 1;
  END IF;
END $$;

-- 2. Add the named UNIQUE CONSTRAINT (guarded).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass
      AND conname = 'notifications_recipient_type_actor_entity_key'
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_recipient_type_actor_entity_key
      UNIQUE (user_id, type, actor_id, entity_id);
  END IF;
END $$;

-- 3. Rewrite the trigger functions to use ON CONFLICT ON CONSTRAINT.
--    CREATE OR REPLACE is inherently idempotent.

CREATE OR REPLACE FUNCTION public.create_friend_accepted_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO notifications (
      user_id, type, actor_id, recipient_actor_id,
      title, message, data, entity_type, entity_id, is_read
    )
    VALUES (
      NEW.user_id,
      'friend_accepted',
      NEW.friend_id,
      NEW.user_id,
      'Friend request accepted',
      'accepted your friend request',
      jsonb_build_object('friend_id', NEW.friend_id, 'friendship_id', NEW.id),
      'friendship',
      NEW.id,
      false
    )
    ON CONFLICT ON CONSTRAINT notifications_recipient_type_actor_entity_key
    DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_friend_request_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (
      user_id, type, actor_id, recipient_actor_id,
      title, message, data, entity_type, entity_id, is_read
    )
    VALUES (
      NEW.friend_id,
      'friend_request',
      NEW.user_id,
      NEW.friend_id,
      'Friend request',
      'sent you a friend request',
      jsonb_build_object('requester_id', NEW.user_id, 'request_id', NEW.id),
      'friend_request',
      NEW.id,
      false
    )
    ON CONFLICT ON CONSTRAINT notifications_recipient_type_actor_entity_key
    DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;