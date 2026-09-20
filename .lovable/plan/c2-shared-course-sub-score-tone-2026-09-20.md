# C2 — Shared course sub-score tone

## Build
- Add one exported analytical helper beside `A` that returns `A.GREEN` for scores of 9.0 or higher and `A.MUTE` for lower or absent scores, with the requested green-reservation documentation.
- Replace the three inline course-detail rules with the helper without changing their markup, dimensions, or other styles.
- Update BrowseCourseCard category bars and figures to use the same per-score helper; remove its now-unused milestone tier imports while preserving bar geometry, track, and fill calculation.
- Add the warning above the collapsed milestone themes and clarify `getScoreTier` documentation without changing either system’s behavior.

## Verification
- Extend focused source/behavior tests to cover the shared threshold, all four consumers, unchanged geometry, and removed BrowseCourseCard milestone imports.
- Verify Berkshire (Blue) values render 9.3 green, 8.3 muted, 9.8 green, and 7.1 muted.
- Run the focused tests and TypeScript check; leave Explore, Tour, schedule, and data paths untouched.
