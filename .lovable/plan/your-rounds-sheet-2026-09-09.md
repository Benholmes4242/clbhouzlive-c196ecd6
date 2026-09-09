# Your rounds sheet

## Goal
Replace the pushed `Your rounds here` page with the same 85dvh bottom-sheet shell used by `All 18 holes`, while preserving its only entry point, row analytics, and the canonical scorecard destination.

## Build
- Add `YourRoundsSheet` using the existing `BottomSheet` primitive with the exact All 18 shell options: 85dvh, 22px top corners, shared grabber, fixed head, hairline, and independently scrolling body.
- Put the course name, real total, member best/average, field average, and outline `RailChips` sorting in the fixed head. Sorting appears at 10+ rounds and resets to Most recent on every open.
- Fetch every matching 18-hole course round in one existing-source query and return an exact count from that query. Use the loaded full list for member best/average and the independent exact count for the heading.
- Render compact fixed-column rows with short dates, true-minus score-to-par colours, a best marker, chevron, chronological year dividers only in Most recent order, and the existing `RoundDetailSheet` on tap.
- Open the sheet from the You tab through `?tab=you&sheet=rounds`; keep `/courses/:id/rounds` only as a routed fallback redirect because no other caller exists.
- Add the required English copy to all six course locale files, leaving `Panel`, analytical tokens, `DiscoverSectionHeading`, and `RailChips` unchanged.

## Verification
- Run the project type check, locale JSON validation, whitespace check, and static audits for shell parity, no `Panel` import, full-list/count behavior, sort/year logic, route callers, and row destination.
- Attempt a 390px runtime check; if authenticated course data is unavailable, report that limitation rather than claiming populated-state verification.
- Report the complete course-detail dead-file candidates with an outside-importer result for each; do not delete anything.
