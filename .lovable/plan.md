# Team events on tournament detail

## Goal
Render team-format tournament detail pages with the same real stroke-play board and contest treatment as individual stroke events, while keeping team events excluded from champion-asserting overview surfaces.

## Implementation
- Add `hasStrokeBoard` beside `isStrokeEvent`: stroke and team formats may render boards; cup and match formats remain minimal.
- Add a shared board-entity resolver that:
  - returns player names unchanged for player rows;
  - derives team labels from the feed's `abbr_name` or ambiguity-safe `display_name`;
  - detects repeated surnames once per board from ordered team members and abbreviation segments;
  - normalizes only displayed initial spacing;
  - builds full-name prose from team members;
  - follows the requested honest fallback order and never emits `undefined` or `null`.
- Admit the existing team payload on `BoardEntry` without changing the query.
- Compute the ambiguity set once per board and use the resolver across the detail page's compact board, full board, contest copy, hero verdict, and scorecard target labels. Player rows retain their existing behavior; team rows will not invent a player identity for profile or scorecard navigation.
- Change tournament detail gating to `hasStrokeBoard`, including its board, contest, tee-time, and full-board mounts. Keep `isStrokeEvent` unchanged everywhere outside this page.
- Allow contest selection for team boards while preserving player-only playoff winner resolution. Team ties therefore remain “Finished level.”
- Keep Move fully absent when no row has a current-round value; no empty eyebrow or shell.

## Verification
- Add focused tests for `hasStrokeBoard`, surname ambiguity, initial-form normalization, prose, fallbacks, player rows, and team contest selection.
- Add rendered-section coverage proving team prose appears in the hero and contest, tied teams do not fabricate a playoff winner, and Move renders nothing for all-null `today` data.
- Verify Zurich 2026 and Dow 2026 at 320, 390, and 430 CSS pixels across the contest module, compact board, and full board.
- Report Dow's exact ambiguity-triggered rows and confirm Zurich has none.
- Re-check that Zurich and Dow remain absent from the overview, live strip, and hero carousel.

## Boundaries
- No SQL, migrations, RPCs, view changes, or new data fetches.
- No overview, live-strip, or hero-carousel gate changes.
- No translation changes.
- The pack track remains unchanged.
