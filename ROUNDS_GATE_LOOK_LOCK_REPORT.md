# Rounds gate — Look, then lock: STOP report

## Results
- Full command: `bunx vitest run`.
- Baseline: **4,085/4,085 across 435 files** (last reported green run).
- Current: **4,107 passed / 3 failed / 4,110 executed across 436 files**.
- Delta: **+25 cases / +1 file**: 24 cases in new `src/test/roundsGateLookLock.test.tsx`; one new scroll-trigger analytics case in `src/test/roundsGateAnalytics.test.tsx`. Existing analytics remains 10 cases plus the new case; short-screen remains two. No test files/cases deleted.
- Targeted command: `bunx vitest run src/test/roundsGateLookLock.test.tsx src/test/roundsGateAnalytics.test.tsx src/test/roundsGateShortScreen.test.tsx src/test/roundsGate.test.ts src/features/explore-magazine/__tests__/gateScopeSwitch.test.tsx`: 41 passed / 3 failed / 44.
- Automatic build diagnostic: **2026-10-28T20:36:24Z — build OK**. Earlier 20:35:16Z missing `glimpseFits` export was an intermediate edit and is superseded.
- No known pre-existing failures at the last green baseline; none observed outside the three cases below in this run. Predicate and CB39 scope tests pass unchanged.

## Stop errors (tool wording)
1. `src/test/roundsGateAnalytics.test.tsx:64:35`, “reports once per gated mount despite StrictMode replay and settled query rerenders”:
   `AssertionError: expected "spy" to be called 1 times, but got 2 times`
2. `src/test/roundsGateAnalytics.test.tsx:85:35`, “reports again on a genuine new gated mount”:
   `AssertionError: expected "spy" to be called 2 times, but got 4 times`
3. `src/test/roundsGateLookLock.test.tsx:32:310`, “never unlocks on scrolling back, restores overflow on unmount and resets on remount”:
   `Error: Cannot update an unmounted root.`
   Stack includes `mount src/test/roundsGateLookLock.test.tsx:21:10` and React `react-dom.development.js:29328:11`.

No source or assertion corrections were made after these failures. The full suite confirmed the same three. The analytics fixtures use the document scroller; a prior scroll case can leave its offset at 81px when body-scroll cleanup restores it, causing the next mount to lock immediately. The remount fixture reuses a testing-library container after unmount without clearing its root registry. These are diagnoses, not corrected or verified fixes.

## Implemented
Normal full-height children render unlocked without crop, frost, inert or aria-hidden. Scroll >80px and row-triggered 3000ms timer race to a permanent mount-local lock; an 8000ms no-row fallback starts that timer. Cleanup clears observer, timers and listener. Locked body alone is inert/aria-hidden; navigation remains outside. Card and shade are portalled beneath navigation; no-handicap tile is portalled above it, with modal hiding/focus return, backdrop/Escape/route closing and unchanged tap events/links. Primary CTA and decline styles share the connect flow's owner. Old gate-only locale keys were removed after reader audit; en-XA and disabled locales have no amateur.gate block and are unchanged.

**Scope ruling:** Ben confirmed the free-look sections/figures match the connected page, but CB39's hidden scope control and its test remain unchanged. Mock backdrop sections, Just played, frozen navigation and artwork were not adopted or modified.

## Score blur audit
Marked:
- `ScoreWithToPar.tsx`: outer score-plus-to-par span; inner optional `data-board-main`/`data-board-secondary` score handle. Covers StandoutRounds, CompetitionBoards and recent/topar/net boards.
- `BoardRows.tsx`: `data-board-main`, `data-board-secondary` and `data-index-chip` spans for other board figures/index movement.
- `ScoresLeaderboardsPage.tsx`: CompactRow value and caption spans opt into markers only for Most improved's cut/share and paired index/strokes figures.

RareAirSection has event/rarity/member counts, not score/index figures; TheHundredSection and Top 100 CompactRows have course counts/progress/ranks, not round scores. They are unmarked and unchanged. Names, courses, dates, headings, chips and descriptive journey sentences remain sharp. Attributes have no visual effect outside the gated wrapper.

**Scroller:** the app's canonical page scroller is the **#root container**, resolved by getPrimaryScrollElement (same source as navigation direction tracking). Container overflow is frozen/restored; document fallback uses the existing body lock helpers. No window scroll properties were introduced.

## Existing test changes authorized by this brief
`src/test/roundsGateShortScreen.test.tsx`: both old cases replaced/renamed, inventory 2→2:
- “fits only when one whole row sits inside the glimpse”: old assertions `glimpseFits(120, 100) === true`, `glimpseFits(89, 132) === false`, `glimpseFits(89, null) === true`; replaced with full children/no glimpse/spacer/no pre-lock card because the helper and crop are explicitly removed.
- “renders no glimpse when a full row cannot fit, and the block still renders”: old `[data-rounds-gate-header] === null`, `[data-board-row] === null`, `[data-rounds-gate-card] !== null`; replaced with retained rows after lock and fixed-card internal max-height/scrolling because short-screen crop is superseded.

`src/test/roundsGateAnalytics.test.tsx`: six existing cases updated, 10→11 total:
- “reports once per gated mount despite StrictMode replay and settled query rerenders”: prior `toHaveBeenCalledTimes(1)` and immediate `rounds_gate_viewed {gate_state:'gated'}` now check look_started first and timer-triggered viewed after lock. The remaining total-call assertion currently fails as quoted above.
- “reports again on a genuine new gated mount”: prior two immediate viewed events now expect two look_started events; existing total-call assertion currently fails as quoted above.
- “reports the white CTA tap before retaining its connect destination”: retained `rounds_gate_connect_tap {gate_state:'gated'}` and `/manage/handicap`; fixture advances to lock before tapping.
- “reports the no-handicap tap once and opens the existing sheet” renamed “…opens the glass tile”: retained `rounds_gate_no_handicap_tap {gate_state:'gated'}`; old `/England iGolf/` row lookup becomes `/iGolf, in England/` per new tile copy and fixture locks first.
- “reports the england row without identifiers and retains its external destination”: retained row payload and exact England URL / `_blank` / `noopener,noreferrer`; lookup retargeted to new title and fixture locks first.
- “reports the club row, closes the sheet and navigates to Courses”: retained row payload/no window.open/`/courses`; fixture locks before opening tile.

No predicate, CB39 or other existing tests edited. New test file contains 24 cases covering thresholds, observer/fallback timing, persistence, freeze, focus, score markers, count scopes/fallback, ghost, navigation, tile actions/dismissal and cleanup. The remount case fails as quoted; it was not altered to pass.

## Files changed or created
1. `src/features/explore-magazine/RoundsGate.tsx`
2. `src/features/explore-magazine/roundsGate.css`
3. `src/components/explore-tab-new/courseled/ScoreWithToPar.tsx`
4. `src/components/explore-tab-new/courseled/BoardRows.tsx`
5. `src/features/explore-magazine/ScoresLeaderboardsPage.tsx` (figure attributes only; mount/count/scope/queries unchanged)
6. `src/components/profile/handicap/whs/connect/EmptyStateScreen.tsx` (export shared decline style; existing button output unchanged)
7. `src/index.css` (gate semantic tokens only)
8. `public/locales/en/courses.json` (gate block only)
9. `src/test/roundsGateAnalytics.test.tsx`
10. `src/test/roundsGateShortScreen.test.tsx`
11. `src/test/roundsGateLookLock.test.tsx` (new)
12. `AGENTS.md`
13. `roadmap.md`
14. `ROUNDS_GATE_LOOK_LOCK_REPORT.md` (new)

Project memory index and new rounds-look-then-lock memory record were updated separately. No files deleted. No SQL, migrations/migration files, deployed RPC/edge changes, feed_config, pool cap or native/Median changes.

## Unverified / blocked
Authenticated end-to-end and visual mock matching are unavailable for external_unmanaged authentication; no credentials requested. Browser checks were not attempted after the test stop. Connected-page visual equality and small-screen rendering are therefore not claimed as browser-verified. Final acceptance awaits authorization to correct the three test-fixture failures and rerun.