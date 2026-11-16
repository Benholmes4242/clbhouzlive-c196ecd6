# Island dock zero-rect guard (ruling A)

Change: `src/features/chrome-v2/IslandDock.tsx` immediate recompute only — an all-zero rect (width 0 AND height 0) is treated as not past. IntersectionObserver callback unchanged. No test edits.

## Anchors (none is an empty sentinel)
Every anchor wraps the visible in-flow row the dock copies, so it has a real layout box:
- CoursesContent — `shellTabsAnchor` div wrapping the Courses/Top 100 tab row
- GolfClubView — `tabsRef` on the club tab row
- ActivityPageV2 — `chipsAnchor` div wrapping the activity chips
- ExploreTopControls — `rowRef` on the Explore chip row
- ScoresFilterHead — `data-rounds-scope-anchor` div wrapping ScopeSegmentsRow
- WatchGridPage — `chipsRef` on the grid chips row
- FindPeoplePage — `tabsRef` on the people tab row
Rendered pixel sizes were not measured in a browser this turn (most of these pages need sign-in, unavailable here); the claim rests on each anchor containing visible chips/tabs.

## Suite (four shards)
2,284 / 2,199 / 2,236 / 2,281 = **9,000**, 0 failures (includes 3 dock tests and 6 authSquircles tests; baseline 8,991, +9).
All 23 previously failing dock-consumer tests pass with no edits.

Shard 3 first run: 2 failures in untouched files, both passing alone (24/24) and on a full shard-3 rerun (2,236/2,236):
- `fixOverflowSource.test.ts` "all non-test inline grids declare columns…" — `Error: Test timed out in 15000ms.`
- `kindRails.test.tsx` "opens /find-people?kind=pro and ?kind=creator" — `TestingLibraryElementError: Unable to find role="button" and name "See all, Pros to follow"` (empty body under load).

## Auth squircles commit
The auth work (auth-hero.css, authSquircles.test.tsx) was already captured by platform checkpoint `4793c756b1` before this turn, so it could not be a separate fresh commit without rewriting history. Its 6 tests are included in the 9,000 above.
