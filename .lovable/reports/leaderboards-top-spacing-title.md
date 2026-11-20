# Leaderboards page — top spacing and title in the board header (Option B)

Files: leaderboard.css, LeaderboardTab.tsx, LiveBoard.tsx, BoardTable.tsx, src/test/leaderboardsPage.test.tsx.

- Events row padding 4px 18px 0; `.tour-board-events + .tour-board-top { margin-top:14px }`. CHROME_CLEARANCE unchanged.
- Section head, its right block and ≤340 override deleted (markup and CSS). BoardTable gains optional `headerLead` (first cell of the live header only; pre-tournament branch ignores it) and `headerMarginTop`.
- Page passes `headerLead` (LEADERBOARD title + 26×26 search button, 8px gap, 13px icon) to LiveBoard; no boardHead, no default kicker.
- Search field renders above the header row (margin 16px 20px 0, 16 at ≤340); header row then 10px below it, otherwise 16px.
- Legend moved to `.tour-board-legend-caption.tour-board-legend-caption--page` (8px 20px 0, 16 at ≤340), same boardHasMovementMark gating. Sheet caption unchanged.

Deviation: the search field reaches LiveBoard through a new `aboveHeader` prop (rendered in the old boardHead slot only when headerLead is set), because it must sit between "Your players" and the main board's header. The header row's 16px is measured from whatever precedes it (place line, figure row, or Your players).

Tests (14→… leaderboardsPage 19 → 22):
- Section-title case: CSS assertion now the new rule; also asserts title inside [data-board-pos-header].
- Renamed "…beneath the section head" → "…above the column-header row"; asserts input precedes [data-board-sticky-header].
- Legend helper selector → `.tour-board-legend-caption`; assertions unchanged.
- Added (f), (g), (h).

Shards: 2,266 / 2,282 / 2,301 / 2,431 = 9,280 (9,277 + 3). Typecheck clean. Logs /tmp/lbtop-shard-{1..4}.log. No browser/iPhone check.
