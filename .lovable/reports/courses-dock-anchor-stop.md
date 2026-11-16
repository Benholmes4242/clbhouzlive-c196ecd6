# BRIEF_COURSES_DOCK_ANCHOR — STOP AND REPORT

## Work completed (per brief)
1. `src/features/chrome-v2/IslandDock.tsx` — the observed anchor now lives in `observedRef`; a `useLayoutEffect` with no dependency array runs after every commit, and when `anchorRef.current` differs it disconnects the old observer, observes the new element and recomputes `past` immediately from `getBoundingClientRect().bottom < measureIslandBoundary()`. Disconnect on unmount. Public API unchanged; all seven callers untouched.
2. `src/components/courses/CoursesContent.tsx` — `shellTabsNode` renders once, directly under `CoursesPageHero`, above both branches.
3. `src/components/courses/Top100CoursesHubPanel.tsx` — `shellTabs` prop removed (interface, destructure, render).
4. `src/test/hb3CoursesDock.test.tsx` — extended as the brief authorised: IntersectionObserver mock now records observed/released elements; a `getBoundingClientRect` stub (bottom 160, below the boundary) keeps jsdom mounts unpinned; three new tests added (docked-switch return to top shows one row; Top 100 scroll shows/hides dock; anchor replacement re-observes). All 9 tests in the file pass. One harness fix during development: the swap component needed `key`s — without them React reused the same DOM node and the anchor never changed identity.

## STOP: unexpected failures in other IslandDock consumers
The brief's immediate recompute reads jsdom's all-zero rects as "anchor above the islands" (`0 < 56`), so every test that renders an IslandDock consumer without a rect stub now mounts with the docked copy shown — duplicate tabs/chips.

- Shard 1: 1 failed / 2,283 passed (2,284)
  - `src/test/rsRoundsShelf.test.tsx` › "shows on the For you chip for a signed-in member, after Quick hits, and not on other chips" — `TestingLibraryElementError: Found multiple elements with the role "tab" and name "Shorts"`.
- Shard 2: 11 failed / 2,188 passed (2,199)
  - `src/test/g2dVideoGrids.test.tsx` › "docks region chips only past the row while expanded"
  - `src/test/g2fActivityHeader.test.tsx` › "docks only past its chips and shares filters/counters across copies"
  - `src/test/ws1WatchTop.test.tsx` › 9 tests (restored query, search Cancel, APPLIED_FILL chips, watch_chip_changed, community entry, chip order, See all, placeholder, scoping)
- Shards 3 and 4: not run — the cause is deterministic and identified; named here per the stop rule.

## The decision needed
Two ways out, both touch something the rules protect:
- **A. Product guard:** in IslandDock's immediate recompute, treat a zero-size rect (element not laid out — jsdom, or display:none) as not-past: `setPast(rect.bottom > 0 && rect.bottom < boundary)`. Real-browser behaviour is unchanged (a laid-out anchor at the very top still has bottom > 0); the brief's same-frame recompute is preserved. No test edits.
- **B. Test stubs:** add the same getBoundingClientRect stub to the four failing test files (rsRoundsShelf, g2dVideoGrids, g2fActivityHeader, ws1WatchTop). Product code stays exactly as briefed.

Awaiting authorisation for A or B. No tests were edited beyond the brief-authorised hb3CoursesDock extension.
