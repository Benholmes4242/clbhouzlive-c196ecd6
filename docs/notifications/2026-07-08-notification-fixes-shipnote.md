# Ship note — Notification test-run fixes (5 items)

Date: 2026-07-08
Scope: 5 catalogue defects surfaced by Ben's device test run.
Typecheck: clean.

---

## Item 1 — Auto mark-read on dwell

**File:** `src/pages/ActivityPage.tsx`

- Added a 1000 ms dwell timer that starts when the Activity page has
  rendered with real data and at least one unread notification. On fire,
  runs the same batched server mutation used by the header "Mark all read"
  button (single `.update({ is_read: true }).eq(user_id).lte(created_at, now)`)
  and zeroes `['activity-unread-count']` immediately so the tab / nav badges
  clear live.
- Rows KEEP their unread styling for the current viewing session — the
  effect deliberately does not patch the feed cache. On the next page open
  they render as read (feed invalidation on unmount, already present).
- Cancels on unmount, tab hidden (`visibilitychange`), and navigation-away.
  Fires at most once per visit via a ref; remount re-arms.
- Manual "Mark all read" header button retained (harmless).
- Actionable cards unaffected: `friend_request` still renders Accept/Decline
  regardless of read state (button rendering is not gated on `is_unread`).
- Push behaviour untouched (push copy reads `n.message` server-side).

---

## Item 2 — Top-10 comment notification (copy + deep-link)

### 2A — Copy branches

**Files:** `src/components/activity/notifications/getActionText.ts`,
`src/components/activity/notifications/InboxRow.tsx`

Dedicated branches for `type='top_ten_comment'` and `type='top_ten_reply'`:

- With `data.course_name` present: *"commented on your {Course} Top 10"* /
  *"replied to your comment on {Course}"*.
- Without: *"commented on your Top 10"* / *"replied to your Top 10 comment"*.

The client renders correctly for all existing rows immediately (no backfill).
The reply variant is dormant today — see `docs/notifications/2026-07-08-top-ten-reply-dormant.md`.

### 2A — Trigger enrichment (SQL — SUPERSEDED / DO NOT RUN)

> **Stale draft — preserved below for diff context only.**  
> **Do not run this block.** The live body is in the next section.

```sql
-- SUPERSEDED / DO NOT RUN
--
-- This draft is missing: reply routing to parent commenter, self guard,
-- bidirectional block guard, mention-markup strip, recipient_actor columns,
-- ON CONFLICT bump, actor_avatar, comment_id alias, and correct title copy.

CREATE OR REPLACE FUNCTION public.create_top_ten_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id UUID;
  v_actor_name     TEXT;
  v_course_name    TEXT;
  v_body_preview   TEXT;
  v_is_reply       BOOLEAN := NEW.parent_id IS NOT NULL;
BEGIN
  v_target_user_id := NEW.target_user_id;

  -- Skip self-comments
  IF v_target_user_id = NEW.commenter_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username, 'Someone')
    INTO v_actor_name
    FROM public.user_profiles
   WHERE id = NEW.commenter_id;

  SELECT name
    INTO v_course_name
    FROM public.golf_courses
   WHERE id = NEW.course_id;

  v_body_preview := left(regexp_replace(coalesce(NEW.body, ''), '\s+', ' ', 'g'), 140);

  INSERT INTO public.notifications (
    user_id, type, actor_id, entity_type, entity_id, title, message, data
  ) VALUES (
    v_target_user_id,
    CASE WHEN v_is_reply THEN 'top_ten_reply' ELSE 'top_ten_comment' END,
    NEW.commenter_id,
    'top_ten',
    NEW.id,
    CASE
      WHEN v_is_reply THEN v_actor_name || ' replied to your Top 10 comment'
      ELSE v_actor_name || ' commented on your ' || COALESCE(v_course_name, 'Top 10') ||
           CASE WHEN v_course_name IS NOT NULL THEN ' Top 10' ELSE '' END
    END,
    v_body_preview,
    jsonb_build_object(
      'top_ten_comment_id', NEW.id,
      'course_id',          NEW.course_id,
      'course_name',        v_course_name,        -- NEW
      'target_user_id',     v_target_user_id,
      'parent_comment_id',  NEW.parent_id,        -- populated for replies
      'comment',            v_body_preview
    )
  );

  RETURN NEW;
END;
$$;
```

### 2A — create_top_ten_comment_notification — as live, manually applied by Ben 2026-07-08

This is the **canonical** body now in production. It supersedes the stale draft above.

```sql
-- create_top_ten_comment_notification — as live, manually applied by Ben
-- 2026-07-08 (supersedes the stale draft in section 2A — DO NOT RUN that one).
-- Preserves: reply routing to parent commenter, self guard, bidirectional
-- block guard, mention-markup strip, recipient_actor columns, ON CONFLICT
-- bump. Adds: course_name resolution into title + data; actor avatar under
-- both key conventions; comment_id alias alongside top_ten_comment_id.

CREATE OR REPLACE FUNCTION public.create_top_ten_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_uid    UUID;
  v_type             TEXT;
  v_title_suffix     TEXT;
  v_actor_name       TEXT;
  v_actor_avatar     TEXT;
  v_course_name      TEXT;
  v_preview          TEXT;
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

  SELECT gc.name INTO v_course_name
    FROM public.golf_courses gc
   WHERE gc.id = NEW.course_id;

  IF v_type = 'top_ten_comment' AND v_course_name IS NOT NULL THEN
    v_title_suffix := ' commented on your ' || v_course_name || ' Top 10';
  END IF;

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
      'course_name',       v_course_name,
      'top_ten_comment_id', NEW.id,
      'comment_id',        NEW.id,
      'parent_comment_id', NEW.parent_id,
      'actor_name',        v_actor_name,
      'actor_avatar',      v_actor_avatar,
      'actor_avatar_url',  v_actor_avatar
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
```

### 2B — Deep link consumption

**Files:** `src/hooks/useActivityFeed.ts`, `src/pages/ProfilePageV2.tsx`,
`src/components/profile/courses/FavouritesCarousel.tsx`,
`src/components/profile/courses/Top10CourseCard.tsx`,
`src/components/profile/courses/TopTenCardComments.tsx`

- URL contract: `/profile/{targetId}?tab=courses&course={courseId}&top_ten_comment={commentId}[&top_ten_parent={parentId}]`.
  Applied to both the mention-source `sourceType==='top_ten_comment'` branch
  and the native `type==='top_ten_comment'|'top_ten_reply'|entity_type==='top_ten'`
  branch. Reply carries `top_ten_parent` when the trigger populates
  `data.parent_comment_id` (the enrichment SQL above supplies it).
- `ProfilePageV2` already consumes `?tab=courses` (existing mechanism).
  Added one-shot capture of `course` / `top_ten_comment` / `top_ten_parent`
  params via a ref, then strips them from the URL (`setSearchParams({...}, { replace: true })`)
  so back-navigation does not re-open the sheet.
- Params thread down through `FavouritesCarousel` (which also
  `scrollIntoView`s the deep-linked card) → `Top10CourseCard`
  (auto-opens its sheet when its `course_id` matches) →
  `TopTenCardComments` (accepts `initialCommentId` / `initialParentCommentId`
  with the same contract as `CommentsSheet`).
- `TopTenCardComments` deep-link path handles: top-level match → scroll +
  highlight; reply match (parent id known or resolved via loaded replies) →
  scroll + highlight the reply; deleted reply → fall back to parent;
  deleted parent → open at top, no crash.
- **Business profile:** Top-10 lives on personal profiles only
  (`isPersonal && profile?.id` gate in `ProfilePageV2` — verified).

---

## Item 3 — `comment_reply` deep-link scroll

**File:** `src/components/comments/CommentsSheet.tsx`

- The deep-link handler previously fired `highlightComment(initialCommentId)`
  on a 200 ms timer. When the target was a reply, the parent's replies had
  been added to `expandedReplies` but `loadAllReplies` was never called, so
  `comment.replies` was empty and the reply row wasn't rendered when
  `scrollIntoView` fired.
- Reworked to `await loadAllReplies(initialParentCommentId)` before
  highlighting when a parent id is present, then wait two RAFs for the
  reply rows to mount + register refs, then highlight the reply. Deleted
  reply → fall back to parent. Top-level (no parent id) path unchanged.
- URL contract unchanged: `/post/{postId}/comment/{commentId}` →
  `CommentDeepLinkHandler` resolves `parent_id` server-side and forwards
  as `state: { openComments, initialCommentId, initialParentCommentId }`.
  This is the same contract Item 2B mirrors for the Top-10 sheet.

---

## Item 4 — Follow double-speak + full audit

**File:** `src/components/activity/notifications/InboxRow.tsx`

Applied `friend_accepted`'s pattern (composed title line + suppressed detail
line) to every notification type whose enriched `message` is a FULL SENTENCE
beginning with the actor's name. Content-preview types (comment / mention /
top_ten_comment / review families) are unchanged — their detail lines carry
comment/review excerpts and must render.

### Audit table

| Type                              | Category         | Detail line before | Detail line after           |
|-----------------------------------|------------------|--------------------|-----------------------------|
| `follow`                          | FULL SENTENCE    | `n.message` (echoed name) | **null (suppressed)**   |
| `new_post`                        | FULL SENTENCE    | `n.message` (echoed name) | **null (suppressed)**   |
| `business_member_added`           | FULL SENTENCE    | `n.message`               | **null (suppressed)**   |
| `business_team_member_joined`     | FULL SENTENCE    | `n.message`               | **null (suppressed)**   |
| `friend_request`                  | FULL SENTENCE    | null (already suppressed) | unchanged               |
| `friend_request_sent`             | FULL SENTENCE    | null (already suppressed) | unchanged               |
| `friend_accepted`                 | FULL SENTENCE    | "You're now connected" (static) | unchanged        |
| `comment` / `comment_post`        | CONTENT PREVIEW  | excerpt                   | unchanged               |
| `comment_reply`                   | CONTENT PREVIEW  | excerpt                   | unchanged               |
| `comment_mention`                 | CONTENT PREVIEW  | excerpt                   | unchanged               |
| `mention` / `mention_post`        | CONTENT PREVIEW  | excerpt                   | unchanged               |
| `top_ten_comment`                 | CONTENT PREVIEW  | excerpt                   | unchanged               |
| `top_ten_reply`                   | CONTENT PREVIEW  | excerpt                   | unchanged               |
| `top_ten_mention`                 | CONTENT PREVIEW  | excerpt                   | unchanged               |
| `course_review` / _received / _friend | RATING+EXCERPT | `{n}/10 – excerpt`   | unchanged               |
| `review_response_posted`          | CONTENT PREVIEW  | response excerpt          | unchanged               |
| `course_claim_rejected` / verification family | REASON | reason string             | unchanged               |
| `business_team_invited`           | STRUCTURED       | "as {Role}"               | unchanged               |
| all other (system/support/…)      | DEFAULT          | `n.message`               | unchanged               |

Design choice for `follow`: brief permitted either a static neutral line or
suppression; chose suppression to match `friend_request` (the closest
single-line social precedent). If a static line is preferred later, one word
change (`return "…";`) achieves it — no structural impact.

Push copy unaffected across all types.

---

## Item 5 — Catalogue: `top_ten_reply` marked DORMANT

Doc: `docs/notifications/2026-07-08-top-ten-reply-dormant.md`

No code change. `getActionText` / `getVerb` branches for `top_ten_reply`
ship anyway so the row renders correctly the day the reply UI exists.

---

## File diff summary

| Item | File | Change |
|------|------|--------|
| 1 | `src/pages/ActivityPage.tsx` | 1000 ms dwell timer, batched server mark-read, badge zero-out |
| 2A | `src/components/activity/notifications/getActionText.ts` | `top_ten_comment` + `top_ten_reply` branches (course-aware) |
| 2A / 4 | `src/components/activity/notifications/InboxRow.tsx` | Verb branches for top-ten; detail suppression for follow / new_post / business_member_added / business_team_member_joined |
| 2B | `src/hooks/useActivityFeed.ts` | URL contract includes `course` + `top_ten_comment` + `top_ten_parent`; native top-ten branch added |
| 2B | `src/pages/ProfilePageV2.tsx` | One-shot deep-link capture + param strip; forwarded to FavouritesCarousel |
| 2B | `src/components/profile/courses/FavouritesCarousel.tsx` | `initialCourseId`/`initialCommentId`/`initialParentCommentId` props; card scroll-into-view |
| 2B | `src/components/profile/courses/Top10CourseCard.tsx` | Props forwarded; auto-open sheet when this card is the deep-link target |
| 2B / 3 | `src/components/profile/courses/TopTenCardComments.tsx` | `initialCommentId` contract mirroring CommentsSheet; reply-aware fallback |
| 3 | `src/components/comments/CommentsSheet.tsx` | Reply-aware deep link: awaits `loadAllReplies` then RAF×2 before highlight; deleted-reply falls back to parent |
| 5 | `docs/notifications/2026-07-08-top-ten-reply-dormant.md` | New — dormant catalogue entry |

## SQL routed to Ben (not applied)

- `create_top_ten_comment_notification` enrichment above (adds `course_name`
  to `data`; ensures `parent_comment_id` present for reply payloads;
  reworked title copy).

## Not folded in

- Lazy-route audit table — separate in-flight item.
