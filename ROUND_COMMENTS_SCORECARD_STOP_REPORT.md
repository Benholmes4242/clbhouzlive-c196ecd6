# Round comments over the scorecard — STOP

## Changes
- `RoundDetailSheet.tsx`: all scorecard dismissals delegate to the comments' live draft guard while comments are open; otherwise the original `onClose` runs. Horizontal dragging is passed as null while comments are open. Initial opening and the comment-button action are unchanged.
- `CommentsSheetV2.tsx`: optional `layer` defaults to `base`; stacked comments use a guarded Escape handler and their own history marker, registered after the scorecard mounts. An optional guard-registration callback lets the scorecard delegate without bypassing typed-draft protection. These lifecycle changes are stacked-only.
- `zIndex.ts`: added stacked backdrop/sheet tokens 12004/12005; default comments remain 12002/12003.
- Ben explicitly approved guard delegation and the separate comments history entry after the brief's direct state-clear conflicted with its draft-warning requirement.
- Architecture ownership is documented beside RoundDetailSheet and CommentsSheetV2, not duplicated in AGENTS.md.

## Test result and stop
Command:
`bunx vitest run src/test/roundCommentsStacked.test.tsx src/test/scorecardGlassAccessibility.test.tsx src/test/roundAndReviewComments.test.tsx src/test/roundCommentsOneIdentity.test.tsx src/test/commentsSheetCounts.test.ts src/test/cb61SheetDoors.test.tsx --maxWorkers=2`

**42 passed / 14 failed / 56 executed across six files.** All five existing files passed unchanged (37 tests). New file: 19 tests, five passed and fourteen failed.

Every failure has the same incomplete new fixture: its `useCommentsV2` mock provides `addComment` but omits `editComment` and `deleteComment`, whose pending state is read even when their dialogs are closed.

Tool error:
```text
TypeError: Cannot read properties of undefined (reading 'isPending')
❯ CommentsSheetV2Inner src/features/comments-v2/CommentsSheetV2.tsx:563:41
563| disabled={editComment.isPending || !editText.trim()}
```

Failed cases in `src/test/roundCommentsStacked.test.tsx`:
- Activity arrival opens comments, first backdrop closes only comments, second closes the card
- card / escape / back / swipe dismisses only comments while open (four cases)
- the own comment button opens the same stacked comments
- horizontal drag is ignored while comments are open and restored after dismissal
- backdrop / card / escape / back asks before closing typed comments (four cases)
- base / stacked uses the specified backdrop and sheet layers (two cases)
- default callers retain base layers and no history registration

No corrections or reruns after failure. No existing assertions changed, deleted, renamed or rewritten: old → new is not applicable. Full shards were not run because of the stop rule. Last reported full-suite baseline: **5,643/5,643 across 528 files**. Candidate inventory is **5,662 across 529 files** (+19/+1 solely `roundCommentsStacked.test.tsx`); this is not a full-suite result.

No pre-existing failed tests identified. Existing jsdom diagnostic noise in `cb61SheetDoors.test.tsx`: `Error: Could not parse CSS stylesheet`, from the shared review score row's `@container` rules; all nine cases pass. Similar noise was documented in prior WF1 runs.

Automatic preview check: latest `/tmp/observability/build-errors.log` entry **2026-11-02T07:31:01Z — build OK**. No manual build/typecheck was run (the harness owns those checks); standalone TypeScript validation is not claimed.

## Other nested comments callers — unchanged audit
The background audit incorrectly inferred comments shell layers from `COMMENTS_SHEET_Z = 12100`. Direct source inspection confirms that constant is used for the discard dialog, not the comments backdrop/panel, which were hardcoded 12002/12003 and now remain those values in default mode.

- `src/components/posts/ReviewBottomSheet.tsx`: comments open from a portalled review sheet at 240/241. Default comments 12002/12003 clear the review. **Not the same backdrop-layer fault.** Host dismissal callbacks do not independently protect open comments; base comments still have no own Escape/history entry.
- `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx`: default viewer layer 200 is below comments, so **not the same fault in that mode**. Viewer layers are selected at open time; a viewer opened above sheets can use 12200, which outranks default comments and can obscure them. The viewer's Escape handler closes the viewer without consulting comments. **Related host-dismissal risk**, unchanged.
- `src/pages/Clubhouse.tsx` and `src/components/posts-tab/PostsTabContent.tsx`: render sibling comments and RoundDetailSheet overlays, but their inspected comment actions open from feed posts, not from inside the scorecard; the scorecard's own comments are owned by RoundDetailSheet. A simultaneous base comment sheet and scorecard would share 12002/12003, so layering is not safe if such coexistence is reached. No confirmed nested launch there; unchanged.
- Remaining callers (`LoopCard`, `NewsTabPage`, `ProfileTopTenRail`, `HomeRail`, `WireFeedSlide`, `ExploreMagazine`, `StoryEngagementBlock`) open from card/page/feed surfaces rather than an inspected containing sheet. Base lifecycle remains unchanged.

## Limits and protected scope
Signed-in Activity → round → comments end-to-end is unavailable because browser authentication is `external_unmanaged`; no signed-in browser/device claim. The new test uses the real RoundDetailSheet, comments guard and ScorecardGlassOverlay with mocked data and card content; it does not exercise a real notification or the router's RoundPage host.

No SQL, migrations, migration files, deployed RPC/edge-function edits, feed_config edits, round_pool_cap changes, native/Median changes or edits to ScorecardGlassOverlay/CardScorecardSheet.

Next step requires authorization to complete the new `useCommentsV2` fixture's mutation exports without changing any assertion, then rerun focused checks and full shards.