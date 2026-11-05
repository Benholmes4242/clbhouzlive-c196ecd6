# Tour menu Live board — STOP

Implemented the signed-off Live board in TourGlance: responsive 346px card width, five/four one-row section tiles, Leaders-only menu label, live-tour count, real logo chips and leader figures from the existing useLiveTournaments payload, signed scores with under-par-only red marker, round line, Starts weekday/Final states, selected background/white stripe without ticks, and local off-week grouping. Shared picker rows now require the chosen slug before a viewed tournament can select a real-tour row. Shared shell lifecycle and sectionsOnly behavior stay unchanged.

## STOP: exact failure
Command: `bunx vitest run src/test/tourMenuLiveBoard.test.tsx src/test/tourIsland.test.tsx --maxWorkers=2`.
**28 passed / 1 failed / 29 executed across two files**. New file passed **15/15**; existing tourIsland passed **13/14**.

`src/test/tourIsland.test.tsx:235:30`, `TourGlance > anchors left to the left island, not the right`:
`AssertionError: expected '' to be 'min(346px, calc(100vw - 24px))' // Object.is equality`
at `expect(card.style.width).toBe('min(346px, calc(100vw - 24px))');`.

No repair after this failure; four shards and 320px/browser validation were not run. Complete output retained at docs/verification/tour-menu-live-board/focused.log. Preview automatic build says `build OK` at 2026-11-05T21:51:32Z; no manual build/typecheck. Not shipped/verified complete.

Pre-existing blockers from the separate Explore task remain untouched: expRing1.test.tsx:31:33 has two `expected '' to be 'none'` failures; ws3WatchBottom.test.tsx has 17 missing DARK_HAIRLINE mock-export failures. They were not rerun here or labelled flakes. They would prevent a green full suite even after this Tour width assertion is resolved.

## Test ledger / counts
Last verified full suite **7,024 / 620**. Pending Explore adds **3 / 1**; this task adds **15 / 1** in tourMenuLiveBoard.test.tsx, so expected inventory **7,042 / 622**, not full-suite executed/passing.

Existing test file edited: src/test/tourIsland.test.tsx, unchanged **14 cases**:
- `lists tour rows from the shared model and selects through selectTour`: `expect(rows).toHaveLength(7)` → `expect(rows).toHaveLength(2)`; off-week rows intentionally move to the summary, shared model still retains them.
- `marks the tour in view with the check and dims unacceptable rows` renamed `marks the tour in view with the selected row and dims unacceptable rows`; selection/disabled assertions retained. `expect(dimmed.style.opacity).toBe('0.45')` → `expect(dimmed).toHaveClass('tour-menu-row')`, because disabled opacity now belongs to local CSS; actual opacity still needs browser proof.
- `anchors left to the left island, not the right`: `expect(card.style.width).toBe('316px')` → `expect(card.style.width).toBe('min(346px, calc(100vw - 24px))')`; this new expectation failed as quoted above. Other anchor assertions unchanged.
No tests deleted or fixture mocks changed. The existing react-i18next mock was preserved. New tests use the required initReactI18next/defaultValue-or-empty mock and cover three chosen scopes, within-tour event/first-slide selection, five/four section columns and live-count presence, surname/signed scores/under-par marker, ties/no leader, off-week grouping/absence and upcoming/completed structure.

## Files / remaining verification
Product: TourGlance.tsx; new tour-glance.css; useTourPickerRows.ts; src/index.css semantic menu tokens; en/en-XA tourhub.json menu keys. New test: tourMenuLiveBoard.test.tsx; existing test: tourIsland.test.tsx. Documentation: this report, roadmap, saved Live board requirement. Local ownership rules sit in TourGlance's header; no shared shell or TourPickerSheet markup changes.

Real leader hook is unchanged and no additional reads introduced. Dedicated TourPickerSheet mounting, actual logo/ellipsis/320px geometry, active tile paint, selected stripe/background and full authenticated menu interaction remain unverified. No SQL/migrations/deployed RPC/edge/native/Median changes; feed_config untouched, cap 30, and guest browsing/review wizard/news/round plots untouched.