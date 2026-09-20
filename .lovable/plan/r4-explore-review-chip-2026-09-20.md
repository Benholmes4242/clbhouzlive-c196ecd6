# R4 Explore review chip

## Build
- Add an opt-in `stacked` presentation to `FigureChip`; preserve its current default styles for round, rank, and course chips.
- Pass `stacked` only for review ratings.
- Use `getScoreTier(...).isExceptional` to decide whether the tier word appears, while retaining `courseSubScoreTone` as the colour owner.
- Apply the figure tone and dark shadow to the Exceptional unit.
- Disable uppercase and letter spacing for Japanese and Korean units.

## Verification
- Add focused assertions for stacked review behavior, Exceptional gating, CJK typography, colour ownership, and unchanged sibling callers.
- Measure the old and new 9.4 and 7.1 chips at 320px.
- Render all six supported locales, report the widest Exceptional label, and compare the unchanged inline course-rating chip.
- Run focused tests and the TypeScript check.

## Scope
- No SQL.
- Do not change round/rank/course chip behavior, ReviewTile, Courses browse, or C3 surfaces.
