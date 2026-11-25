# Brief 20 — status

Commits: audit 58bf588be5 · A (partial) a5f98916c8 · C 6cb5ead9ca · E 670c4ac1df · D 809b9b5679. B not started.

## STOP — shard 1
`npx vitest run --shard=1/4`: 2,510/2,511 passed, 226/227 files.
Failure: `src/test/roundAndReviewComments.test.tsx:91:17` — "src/pages/Clubhouse.tsx resolves round and review targets before falling back to the post":
`AssertionError: expected 'import React, { useState, useEffect, …' to match /['"]round['"]/`.
Cause: Part A moved Clubhouse's round > review > post choice into `engagementTargetFor` (src/lib/engagement/engagementTarget.ts), so Clubhouse.tsx no longer contains the literal 'round'. Behaviour is unchanged; the source-text test encodes the old location. Not edited — awaiting a ruling.
Shard 2 also ran in the same command (2,516/2,516) before the stop was read; shards 3–4 not run. No baseline delta stated.

## Part B
Not implemented. Rail tiles need each source post's full media set in one batched read, but there is no shared post_media → viewer MediaItem mapper (video stream/HLS derivation lives per surface). Writing a new one is a new canonical mapping; needs a ruling.

## Part D
Overlays claim a layer on open (src/lib/overlayLayers.ts): viewer, review sheet (re-claims on REVIEW pill via openTick), More, Comments, Likes, scorecard, media preview. Proven by layer-rule tests (brief20OverlayLayers.test.tsx), not by rendering all overlays together.

## Part E
Review card closes on any non-control tap; drag/scroll never closes (shared useTapAnywhereDismiss with scorecard). brief20ReviewTapDismiss.test.tsx, 4 tests. Existing scorecard tests unchanged and passing.

## Continuation (rulings on the stop) — STOPPED in shard 2

Commits: ruling 1 a1e5d3459c · B 7ab0319c7c · A finish (+ B-r6 magazine opener) 1eb045e3d5 · D rendered test 4327c3d70a, cleanup fix dc4d303b29 · audit 3714442491.

Shard 1/4 (first run): 2,513/2,513, 228 files, but 1 unhandled error — a viewer close timer from the new brief20OverlayRendered.test.tsx fired after teardown (`document is not defined`, FullscreenFeedOverlay.tsx:813). Fixed in that new file only (unmount before store reset). Rerun: 2,513/2,513, 228 files, 0 errors.

Shard 2/4: 2,521/2,522, 227/228 files. STOP.
`src/test/roundCommentsOneIdentity.test.tsx` — "the Explore round tile opens comments as round + score id, never post":
`expected 'import { Fragment, useCallback, useEf…' to contain 'setOpenComments({ type: 'round', id…'`.
Cause: the brief's "ExploreMagazine comments open through engagementTargetFor" changed that line to `setOpenComments(engagementTargetFor({ id: scoreId }, { scoreId }))` — still round + score id. The test reads the old literal. Not edited; shards 3–4 not run.

Test edits this continuation:
- roundAndReviewComments.test.tsx (ruling 1): `/['"]round['"]/`, `/['"]review['"]/`, `/review\?\.reviewId/` → import of engagementTargetFor + a call to it; usePostScoreIds, .settled, not-targetType="post" kept.
- whatsBeenPlayedV4.test.tsx: "opens one sideways page of the whole row… index 2" → "one page per source in rail order (BRIEF 20 B)": was 1 page ['m1','mi1','m2'], now pages [['m1','m2'],['mi1']], index 0, mediaId 'm2', awaited. Sheet test: same page shape, mediaId 'm2' and VIEWER_ABOVE_SHEETS_Z kept, awaited. Why: Part B replaces the V4 one-row-page rule.
- playedMemberMediaAutoplay.test.tsx: `expect(f.opened).toHaveLength(1)` → `await waitFor(...)`. Why: the tap now awaits the source read (≤800 ms).
These two were changed under "a brief that changes a documented rule authorises the test that encodes it"; flagging in case you want them treated as stops.

New tests: brief20TileSources (4), brief20OverlayRendered (2), +1 in brief20Engagement (same comments key).

B-r4 limitation: a non-review source post shows only media already in the tile's loaded course and hole sets; its other media is not shown.
B-r3 note: landing matches media id, then the photo URL, then index 0 (URL step added because hole-tile ids are hole-media row ids, not review-media ids).
D note: the rendered comments case opens CommentsSheetV2 from a test button while the lifted viewer is open, not from the viewer's own comment icon.

No SQL run; no migration written.

## Continuation 2 — STOPPED before shards (Part G)
- Ruling 3 applied: `roundCommentsOneIdentity.test.tsx:50` `toContain("setOpenComments({ type: 'round', id: scoreId })")` → `toContain("setOpenComments(engagementTargetFor({ id: scoreId }, { scoreId }))")`; added in the same `it` `expect(engagementTargetFor({ id: 'x' }, { scoreId: 's1' })).toEqual({ type: 'round', id: 's1' })`; one import line added at :34 (needed for that assertion). Commit 4e03ae5555.
- Part G source: `WatchFeaturedDeck.tsx` — one batched `posts` read (`id, source_review_id, whs_score_id`), each row via `engagementTargetFor`; review rows use `useViewerEngagement` (like/state/counts/share), round rows use `useStoryEngagement('round')` + `useContentReactions` toggle; `viewer_liked_post` only enabled for settled post-targeted rows; actions inert while pending; failure logs `[watch featured] source post read failed` and falls back to post behaviour. Comments: non-post rows call `onOpenComments(postId, { sourceReviewId, whsScoreId })`, which ExploreMagazine's existing `openPostComments` resolves through `engagementTargetFor` (same contract as Watch rows); post rows still call `onOpenComments(postId)`.
- New `src/test/brief20FeaturedTarget.test.tsx`: 4 tests (G4), pass. Typecheck clean.
- STOP: `src/test/fw1FeaturedDeck.test.tsx` — 30 of its tests fail: `TypeError: Cannot read properties of undefined (reading 'onAuthStateChange')` at `src/hooks/useSupabaseSession.tsx:51:54`. Its `supabase` mock is `{ rpc }` only; the deck now mounts the review/round engagement hooks, which read the session. Not edited. Ruling needed: authorise adding mocks for `useStoryEngagement`, `useContentReactions` and a `from().select().in()` stub to that file's mocks (no assertion changes), or another approach.
- Shards not run.
