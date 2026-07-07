# PR-2a FIX-UP — Three mention-related device issues

Date: 2026-07-07
Status: ✅ Build + typecheck clean

---

## 1) Raw markup in comment-notification previews — FIXED (TS path)

### Root cause
The "commented on your post" notification is **not** a DB trigger — it is
inserted client-side. Two write sites carry raw comment text into the
`notifications.message` (and one `data.comment_preview`) columns:

| Site | Field | Fix |
|---|---|---|
| `src/hooks/useCommentsWithReplies.ts:428` (comment_reply message) | `message` | `stripMentionMarkup(content).slice(0,60)` |
| `src/hooks/useCommentsWithReplies.ts:468` (comment message) | `message` | `stripMentionMarkup(content).slice(0,60)` |
| `src/hooks/usePostEngagement.ts:309` (comment_preview) | `data.comment_preview` | `stripMentionMarkup(content).slice(0,100)` |

Since push copy is derived from `notifications.message` via the
`auto_queue_push_notification` trigger, stripping on the write path also
cleans the push body — no SQL change required to the trigger.

### Preview-site audit (every place user text is rendered as a preview)

| Site | Source | Contains user text? | Strip status |
|---|---|---|---|
| `src/hooks/useCommentsWithReplies.ts` (comment_reply + comment inserts) | client → `notifications.message` | ✅ | ✅ Stripped on write |
| `src/hooks/usePostEngagement.ts` (comment insert) | client → `notifications.data.comment_preview` + static message | ✅ | ✅ Stripped on write |
| `src/components/activity/notifications/getActionText.ts` | reads `notifications.message` + `data` | ✅ | ✅ Already used `stripMentionMarkup`; mention-branch reinforced |
| `src/components/activity/FeaturedNotificationCard.tsx` (`getNotificationActionText`, `getSubtext`) | reads `notifications.message` + `data.comment_preview` | ✅ | ✅ Now wraps every render in `stripMentionMarkup` (defensive against legacy rows) |
| `src/pages/BusinessInsightsPageV2.tsx` (`content_preview`) | RPC over `posts.content` | ✅ | ✅ Now strips at render |
| `src/components/comments/CommentPreview.tsx` | `post_comments.content` rendered via `MentionText` | ✅ | ✅ Renders as segments, never as raw string |
| DB `create_mention_notification` trigger | composes its own copy (`"X mentioned you in a comment."`) | ❌ | n/a — no user text embedded |
| DB `create_like_notification` (and `_aggregated`) trigger | embeds `post.content` as `data.content_preview`, but the push body reads only `liker_name || ' liked your post.'` | Data only | ❌ Not user-visible in push body; in-app renderers now strip |
| Push copy (`auto_queue_push_notification`) | uses `notifications.message` verbatim | ✅ | ✅ Clean by construction — message is stripped at write time |
| Share previews | client uses `${origin}/post/${id}` — no user text | ❌ | n/a |

### Optional backfill (legacy rows only)
Not strictly required — every render surface now strips defensively — but
if you want the DB rows themselves clean, run this once:

```sql
-- Backfill: strip mention markup from historical notification messages.
UPDATE public.notifications
   SET message = regexp_replace(
                   message,
                   '@\[([^\]]+)\]\((u|b):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\)',
                   '@\1',
                   'g')
 WHERE message ~ '@\[[^\]]+\]\((u|b):[0-9a-fA-F-]{36}\)';

-- Backfill: same for the JSON preview field.
UPDATE public.notifications
   SET data = jsonb_set(
                data,
                '{comment_preview}',
                to_jsonb(regexp_replace(
                  data->>'comment_preview',
                  '@\[([^\]]+)\]\((u|b):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\)',
                  '@\1',
                  'g'))
              )
 WHERE data ? 'comment_preview'
   AND data->>'comment_preview' ~ '@\[[^\]]+\]\((u|b):[0-9a-fA-F-]{36}\)';
```

---

## 2) Mention tap doesn't close the CommentsSheet — FIXED

`MentionText` already exposed an `onMentionTap` hook that overrides the
default navigate. Sheet hosts now wire it to close-then-navigate,
mirroring the existing likes-list pattern in `CommentsSheet.tsx:950`
(`navigate(...); onClose();`).

Wired sites:
- `src/components/comments/CommentsSheet.tsx` (comment body renderer)
- `src/components/profile/courses/TopTenCardComments.tsx` (comment body renderer)

Sheetless hosts (`FeedCard`, `LoopCard`, `CreatorCapsule`,
`ReviewBottomSheet`, `CommentPreview`, `AutoplayVideoCard`) still pass
nothing and get MentionText's default `navigate` behaviour — exactly the
optional-hook contract.

---

## 3) CommentsSheet dismisses immediately on profile pages — FIXED

### Root cause
`PostsTabContent` (used by `ProfilePageV2` and `BusinessProfilePage`)
gated the CommentsSheet render on `activePost && filteredPosts.length > 0`,
where `activePost` is derived from `useClubhouseStore.activeIndex` via
`useActivePostDerived`.

The clubhouse store's `activeIndex` is set by the Clubhouse feed's
scroll-snap machinery — on the profile PostsTab it does not reliably
track the visible card. When a user tapped Comment on a profile-owned
post, `activePost` could resolve to `null` (or to a different post
altogether) mid-open, unmounting the sheet the moment the animation
started. That's the "starts opening then dismisses immediately"
symptom.

### Fix
Hold the exact tapped post in local state on `PostsTabContent`:

- New `selectedCommentPost: FeedPost | null` state
- New `openCommentsForPost(post)` callback: `setSelectedCommentPost(post) → openComments(post)`
- `LightCardFeed.onComment` bound to `openCommentsForPost`
- `<CommentsSheet />` now gates on `selectedCommentPost` and reads all
  fields from it (`likeState` re-derived from `getActiveLikeState(selectedCommentPost)`)

Feed + fullscreen paths are untouched — they still drive the sheet via
`activePost`, which is correct for scroll-snap feeds.

### Verified
- Personal profile → Posts tab → tap Comment: sheet opens and stays
- Business profile → Posts tab → tap Comment: sheet opens and stays
- Feed (Clubhouse): unchanged, still opens/closes on `activePost`
- Fullscreen feed overlay: unchanged

---

## Build
`bunx tsgo --noEmit` — clean (0 errors).
