# Tour Overview device pass

## Group A — correctness first

- Move the unchanged state pill into the hero’s lower content block, above the tour label with an 8px gap.
- Make “Also this week” use the hero-slide tournament object as its authority, include only live events or events starting by the coming Sunday, and show weekday-only beyond 24 hours.
- Make overview board POS and THRU tracks conditional on the five rendered rows. When no position exists and every score is level par, replace rows with the existing FIRST TEE / DEFENDING / FIELD summary.
- Render the venue band only when it adds a qualifying members’ rating or Top 100 rank.
- Add focused tests, run type/build checks, and report Group A before proceeding.

## Groups B and C — layout and polish

- Put board rows, picks, and CTA on one raised card; align picks to the shared 24px text edge.
- Restore natural player-name order; left-align a lone three-up fact; shorten Also This Week tour labels and constrain them to two lines with a 12px gap.
- Apply the requested countdown thresholds and compact hero date formatting.
- Normalize OUR PICKS and CTA copy; restore the CTA’s 44px minimum with 12px vertical padding.
- Measure the 390px footer gap and remove only duplicated section padding if found.

## Confirmations and validation

- Establish whether the upcoming LPGA picks row is withheld because predictions are absent or because of phase gating; do not alter it based on assumption.
- Log the five rendered World rows’ movement values and confirm whether the missing movement column is data-driven.
- Verify 320px and 390px widths, empty-state collapse, focused tests, types, and production build.
- Preserve `liveRoundStats.ts`, `CourseShapePanel.tsx`, `useCourseShapeRows`, shared hero/news dimensions, shell behavior, and all unrelated surfaces.
