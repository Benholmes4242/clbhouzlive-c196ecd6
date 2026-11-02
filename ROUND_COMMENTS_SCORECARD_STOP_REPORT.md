# Round comments over the scorecard — STOP

## Changes
- `RoundDetailSheet.tsx`: all scorecard dismissals delegate to the comments' live draft guard while comments are open; otherwise the original `onClose` runs. Horizontal dragging is passed as null while comments are open. Initial opening and the comment-button action are unchanged.
- `CommentsSheetV2.tsx`: optional `layer` defaults to `base`; stacked comments use a guarded Escape handler and their own history marker, registered after the scorecard mounts. An optional guard-registration callback lets the scorecard delegate without bypassing typed-draft protection. These lifecycle changes are stacked-only.
- `zIndex.ts`: added stacked backdrop/sheet tokens 12004/12005; default comments remain 12002/12003.
- Ben explicitly approved guard delegation and the separate comments history entry after the brief's direct state-clear conflicted with its draft-warning requirement.
- Architecture ownership is documented beside RoundDetailSheet and CommentsSheetV2, not duplicated in AGENTS.md.
- **Follow-up (authorized test-only mock completion):** `src/test/roundCommentsStacked.test.tsx`'s `useCommentsV2` mock now supplies the full idle mutation shape — `editComment`, `deleteComment`, `toggleLike`, `hideComment`, `reportComment` each `{ isPending: false, mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined) }`, and `addComment` gained `mutate`/`mutateAsync`. No assertion was touched; `CommentsSheetV2.tsx` is unchanged.

## Test result and stop
Mock completion applied exactly as authorized; every assertion unchanged (component untouched). File rerun:

Command: `npx vitest run src/test/roundCommentsStacked.test.tsx`

**15 passed / 4 failed / 19 executed in one file.** The mock fix cleared the original `isPending` crashes: the previously failing fourteen now render and 11 of them pass. The four typed-comment cases progress further and fail on a **new, different error** — deterministic across two runs.

Failed cases in `src/test/roundCommentsStacked.test.tsx` (all in `round comments close above the scorecard`):
- backdrop asks before closing typed comments
- card asks before closing typed comments
- escape asks before closing typed comments
- back asks before closing typed comments

Tool error (`src/test/roundCommentsStacked.test.tsx:127`, at `fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), …)`):

```text
TestingLibraryElementError: Unable to find an accessible element with the role "textbox" and name "Draft"
```

## Diagnosis — component conflict, not the mock
The Draft input IS in the DOM (`<input aria-label="Draft" />` inside the stacked comments sheet), but both the stacked comments backdrop (`z-index 12004`) and sheet (`z-index 12005`) carry `data-aria-hidden="true"` while the scorecard card below (`z-index 12003`) is the only accessible dialog. Role queries therefore cannot reach the composer.

Source: `ScorecardGlassOverlay.tsx:87` calls `hideOthers(card)` (`aria-hidden` package) whenever the glass card is open, comment — "Every floating glass card is modal to assistive technology." When the stacked comments sheet mounts above it, the scorecard's aria pass marks the higher, interactive comments layer as background. The layers are visually correct (12004/12005 above 12003); the assistive layering is inverted: the topmost surface is hidden from assistive technology and the covered scorecard remains the only reachable dialog.

This failure was previously masked: before the authorized mock completion those cases crashed in render at `CommentsSheetV2.tsx:563` (`editComment.isPending` on undefined) before reaching the query at line 127.

Fix options need Ben's ruling; none taken without authorization:
- **Component (recommended):** when comments are stacked above, the comments sheet owns the aria pass — call `hideOthers` from the stacked comments layer (or exempt the stacked comments portals from the scorecard's `hideOthers`), so the top layer is reachable and the scorecard is background. Touches `CommentsSheetV2.tsx` (stacked-only) — currently outside authorized scope.
- **Test-only:** query the Draft by `document.querySelector('input[aria-label="Draft"]')` instead of role — but this blesses an inverted accessibility layering and contradicts the assertion's intent; not recommended.

## Full suite
**Not run.** The stop rule forbids shards while a failure stands, and the user's instruction conditioned shards on all fourteen passing. Last reported full-suite baseline: **5,643/5,643 across 528 files**. Candidate inventory is **5,662 across 529 files** (+19/+1 solely `roundCommentsStacked.test.tsx`); not a full-suite result.

No pre-existing failed tests identified. Existing jsdom diagnostic noise in `cb61SheetDoors.test.tsx`: `Error: Could not parse CSS stylesheet`, from the shared review score row's `@container` rules; all nine cases pass. Similar noise was documented in prior WF1 runs.

Automatic preview check: latest `/tmp/observability/build-errors.log` entry at the previous stop was **2026-11-02T07:31:01Z — build OK**. No manual build/typecheck was run (the harness owns those checks); standalone TypeScript validation is not claimed.

## Other nested comments callers — unchanged audit
The background audit incorrectly inferred comments shell layers from `COMMENTS_SHEET_Z = 12100`. Direct source inspection confirms that constant is used for the discard dialog, not the comments backdrop/panel, which were hardcoded 12002/12003 and now remain those values in default mode.

- `src/components/posts/ReviewBottomSheet.tsx`: comments open from a portalled review sheet at 240/241. Default comments 12002/12003 clear the review. **Not the same backdrop-layer fault.** Host dismissal callbacks do not independently protect open comments; base comments still have no own Escape/history entry.
- `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx`: default viewer layer 200 is below comments, so **not the same fault in that mode**. Viewer layers are selected at open time; a viewer opened above sheets can use 12200, which outranks default comments and can obscure them. The viewer's Escape handler closes the viewer without consulting comments. **Related host-dismissal risk**, unchanged.
- `src/pages/Clubhouse.tsx` and `src/components/posts-tab/PostsTabContent.tsx`: render sibling comments and RoundDetailSheet overlays, but their inspected comment actions open from feed posts, not from inside the scorecard; the scorecard's own comments are owned by RoundDetailSheet. A simultaneous base comment sheet and scorecard would share 12002/12003, so layering is not safe if such coexistence is reached. No confirmed nested launch there; unchanged.
- Remaining callers (`LoopCard`, `NewsTabPage`, `ProfileTopTenRail`, `HomeRail`, `WireFeedSlide`, `ExploreMagazine`, `StoryEngagementBlock`) open from card/page/feed surfaces rather than an inspected containing sheet. Base lifecycle remains unchanged.

## Limits and protected scope
Signed-in Activity → round → comments end-to-end is unavailable because browser authentication is `external_unmanaged`; no signed-in browser/device claim. The new test uses the real RoundDetailSheet, comments guard and ScorecardGlassOverlay with mocked data and card content; it does not exercise a real notification or the router's RoundPage host.

No SQL, migrations, migration files, deployed RPC/edge-function edits, feed_config edits, round_pool_cap changes, native/Median changes or edits to ScorecardGlassOverlay/CardScorecardSheet.

Next step requires Ben's ruling on the aria layering above (component fix in stacked comments, or a query change) before rerunning the file and full shards.
