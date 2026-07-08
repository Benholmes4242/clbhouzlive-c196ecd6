# Notifications dedupe hardening + comment-reply trigger (record)

**Status: SQL sent to Ben on 2026-07-08 for manual apply — do not re-run.**

Follow-up batch to the two triggers shipped earlier the same day
(`create_comment_notification`, `create_top_ten_comment_notification`)
and Ben's direct hotfix on the friend_request / friend_accepted triggers
(column-form `ON CONFLICT (user_id, type, actor_id, entity_id)
DO NOTHING`, both functions — recorded here for the audit trail).

## What this migration changes

1. **`notify_friends_on_course_review`** — narrowed the outer
   `EXCEPTION WHEN OTHERS` to a per-iteration block inside the `FOR`
   loop, so a single dup (or any other row-level failure) can't abort
   notifications for the remaining friends. Added column-form
   `ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING` on the
   insert.
2. **`notify_business_on_course_review`** — same `ON CONFLICT DO NOTHING`
   inside the member loop.
3. **`notify_business_team_added`** — `ON CONFLICT DO NOTHING` added.
   **No-op today**: the insert leaves `actor_id` and `entity_id` NULL
   and the dedup index treats NULLs as distinct, so nothing dedupes yet.
   Included per brief so a future column-fill starts deduping without
   another migration.
4. **`notify_course_request_approved`** — same NULL-distinct caveat
   (`entity_id` unset); clause added for the same forward-compat reason.
5. **`create_comment_notification`** — extended to handle replies:
   - `NEW.parent_id IS NOT NULL` → `type='comment_reply'`, recipient =
     parent commenter (owner-resolved via `business_members` for
     business parents, matches client L411-419), `entity_type='comment'`,
     `entity_id=NEW.id` (fresh comment id — same key the client used,
     so the `DO UPDATE` branch never actually collides for replies in
     practice; the clause is still present so future dedup semantics
     are one-line reversible without a schema change).
   - Same self-guard on actor identity, same `user_blocks` guard
     (both directions), same stripped-mention preview.
   - Data payload carries `parent_comment_id`, `replier_actor_type`,
     `replier_actor_id` on the reply branch.

## Sequencing

DB-first per the standing rule. Client-side reply insert at
`src/hooks/useCommentsWithReplies.ts` L422-440 stays in place until Ben
confirms the SQL applied; a separate small commit removes it and points
the removed block at this doc.

## Intentional behaviour

- Reply notifications inherit the same push behaviour as the top-level
  branch: `ON CONFLICT DO UPDATE` re-unreads the in-app row but does
  not re-fire `on_notification_auto_queue_push` (that trigger is
  `AFTER INSERT` only). Consistent with the anti-spam pattern applied
  to `comment` and `top_ten_comment`.
- For `notify_business_team_added` and `notify_course_request_approved`,
  the `ON CONFLICT DO NOTHING` clause is present but inert until the
  inserts fill `actor_id` / `entity_id`. Documented explicitly so a
  later refactor doesn't need to re-derive the reasoning.

## Migration body

See the SQL delivered in-chat 2026-07-08 — five `CREATE OR REPLACE
FUNCTION` blocks (`notify_friends_on_course_review`,
`notify_business_on_course_review`, `notify_business_team_added`,
`notify_course_request_approved`, `create_comment_notification`). No
schema/DDL changes, no new triggers, no policy changes.

## Ben's direct hotfix on the friend triggers (recorded here)

Applied by Ben out-of-band earlier the same day, after the
`notifications_recipient_type_actor_entity_key` constraint was dropped
in the 2026-07-08 comment-trigger migration left the friend triggers
referencing a constraint name that no longer existed. Both switched to
column-form:

```sql
-- notify_friend_request (INSERT on user_friends / friend_requests)
ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;

-- notify_friend_accepted
ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
```

Every `INSERT INTO public.notifications` on the primary paths now uses
column-form dedup. Remaining bare-insert conversions
(edge functions / admin paths) are queued for after the test-harness
run, not part of this batch.
