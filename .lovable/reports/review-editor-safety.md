# REVIEW_EDITOR_SAFETY

## Built (client only; no RPC changed)
- §1 `useReviewMediaPipeline.removeItem`: an existing item now leaves the composer list only and is recorded in `pendingRemovals`; no cleanup, no row delete. `commitRemovals` (instant path, right after `submit_course_review_v2` returns) and the staged path's `onPublished` (only on publish success) call `cleanup-review-media` once for exactly those rows. `discardRemovals` on a failed save restores them to the editor. Abandon/close drops the list. New uploads unchanged.
- §2 `EditLossSheet` (same bottom-sheet pattern as RemoveReviewSheetV2): edit mode, text non-empty → empty and/or pending removals. "Keep them" returns unchanged; "Remove and save" submits.
- §3 `RemoveReviewSheetV2` did NOT name counts ("Your score, verdict, and any media go with it."). Now: "This deletes your review[, its written review][, its N photos][, its N videos] and its post. This can't be undone." Note: "and its post" is always printed, as in the brief's example; the sheet does not know whether a feed post exists.
- §5 Analytics: `review_media_removed {course_id, mode, count}`, `review_edit_loss_confirmed {course_id, text_removed, media_removed}`, `review_edit_loss_kept` (same fields).

## Tests
- Added `src/test/reviewEditorSafety.test.tsx` (6): (a)–(f). (a)–(c) at pipeline level; (d)/(e) on the loss rule and the sheet's buttons, not a full composer mount.
- No existing assertion encoded instant deletion; none changed or deleted.
- Expected total 9,107 + 6 = 9,113.

## STOP — shard 1
- `src/test/coursesRailsUnlimited.test.tsx` › "loaded holes run and refresh › admin hole-tag predicate invalidation refetches the active infinite holes rail" failed in shard 1 (2,225 passed, 1 failed of 2,226) after 7,434 ms. The error text was not captured on the failing run.
- Same shard rerun: passed (4,664 ms). Isolated: 15/15 passed (1,837 ms).
- Untouched file; this is the same test previously accepted once. Timing points to a load-sensitive wait. Shards 2–4 not run.
