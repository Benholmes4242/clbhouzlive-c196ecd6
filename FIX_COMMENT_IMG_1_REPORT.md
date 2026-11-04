# FIX_COMMENT_IMG_1 — comment photos upload to R2

## §4 server check
Satisfied by Ben's COMMENT_MEDIA_CHECK_V1 (2026-11-04 10:39): `add_comment_v2` inserts `p_media_url` unchanged; `comments_v2` checks only content-or-media and media_type null/'image'; no trigger constrains media_url. No SQL run, RPC untouched.

## §2 composer
`CommentComposer.handleFile`: compression unchanged; uploads via `uploadToR2Only(result.file, 'clbhouz-post-images', 'comments/<userId>/<ts>-<rand>.<ext>')`; throws `res.error || 'Upload failed'` on failure or missing publicUrl; sets the pending image to `res.publicUrl`; on failure keeps `console.warn` and adds `toast.error("Couldn't attach photo", { description })` (`@/lib/toast`). The `supabase` import and storage call are removed. Send, restore-on-failure, drafts, Photo attached row unchanged.

## §3 reading
`CommentImageV2` unchanged. No comment-images rows/objects migrated, moved or deleted.

## Other readers of comments_v2.media_url (report only, unchanged)
- `useCommentsV2.ts:304` — maps `row.media_url` through untouched; format-agnostic.
- `CommentCard.tsx:151` and `ReplyRow.tsx:113` — render via `CommentImageV2`, which handles both absolute `https` and bare `comment-images` paths.
- No other src reader: feed comment preview (`useFeedCommentPreview`/`FeedCommentPreview`), round-post comments, story engagement, deep link, realtime and activity links select no media fields; no notification/activity thumbnail reads comment media.

## §5 tests
New `src/test/commentPhotoR2.test.tsx` (4):
1. compresses, uploads once to R2 and submits the returned public URL as an image
2. a failed upload toasts the error, leaves no pending image and does not submit
3. CommentImageV2 renders an https URL directly without signing
4. CommentImageV2 still signs a bare path from comment-images
Added to `adminCoursePhotoR2.test.ts` (1): "FIX_COMMENT_IMG_1: no comments-v2 source calls supabase.storage upload". Existing admin guard test unchanged. No tests deleted/renamed/rewritten.

## Suite (`--maxWorkers=2 --shard=n/4`)
Shard 1: 1,719 · Shard 2: 1,583 · Shard 3: 1,674 · Shard 4: 1,677 = **6,653 tests / 587 files**, 0 failures, 0 unhandled errors. Before: 6,648 / 586 (FIX_OVERFLOW_1). Delta +5 tests (the five named above), +1 file (commentPhotoR2.test.tsx). No pre-existing failures. Logs: `docs/verification/fix-comment-img-1/`.

## Files touched
`src/features/comments-v2/components/CommentComposer.tsx`, `src/test/commentPhotoR2.test.tsx` (new), `src/test/adminCoursePhotoR2.test.ts`, this report, shard logs.
No SQL/migrations, RPC/edge, native/Median, feed_config, guest browsing, review wizard, news or round plots touched; round_pool_cap 30.

Typecheck note: the first build flagged missing required props in commentPhotoR2.test.tsx (lines 40, 56); fixed test-only by passing replyingTo={null}, onClearReply, isSubmitting={false}. File re-run 4/4.

## Close-out (2026-11-04)

- Build: `/tmp/observability/build-errors.log` is absent after the `commentPhotoR2.test.tsx` type fix; per the observability README the file exists only when a build has errors, so the harness build recorded none. No timestamped entry to quote — absence is the clean signal.
- Full suite re-run (`--maxWorkers=2`, sharded 4 ways), logs in `docs/verification/fix-comment-img-1/closeout/`:
  - Shard 1: 1,719 passed (147 files), start 11:37:17
  - Shard 2: 1,583 passed (147 files), start 11:40:21
  - Shard 3: 1,674 passed (147 files), start 11:43:30
  - Shard 4: 1,677 passed (146 files), start 11:46:40
  - **Total: 6,653 tests / 587 files, 0 failures** — matches the expected 6,653 / 587 exactly. No pre-existing failures.
- No other changes made.
