# Discover Board Course Strip

## Scope
- Reduce the Discover board hero’s below-notch content height from 300px to 132px while preserving its notch bleed, leader-course image source, title treatment, and readiness gating.
- Retune the strip scrim, reduce fallback initials, and add a single-line bare course-name caption that only appears after resolution when row 1 has a course name.
- Move the unchanged four-stat pool rail onto the canvas below the optional caption, retaining its reserved-height visibility hold.
- Tighten board rows to the specified padding, avatar, and two-line typography without changing columns, tie handling, self-row styling, or score colours.
- Collapse Courses played by default into a full-width count-and-chevron row; opening it reveals the existing section contents unchanged. Keep all existing data and empty-state gates.
- Update only the Discover loading silhouette that represents this surface so loading geometry matches the new strip and closed Courses played state.

## Validation and report
- Measure the board See all row from the top of the strip at 390×844 before and after, including tie-overflow behavior where available.
- Verify caption/image/row-1 course consistency, missing-course omission, feat-board caption neutrality, sticky filter behavior, Courses played open/closed counts, and no entry-time content swaps.
- Check the longest rendered/catalogue course name for one-line overflow and retain an ellipsis rather than wrapping.
- Confirm whether `CoursesHubSkeleton` is unrelated and whether `AmateurCircuitHero` remains genuinely unreferenced; report any brief discrepancy rather than broadening scope.

## Technical details
- Preserve `VISIBLE_POSITIONS = 10`, tie-cut logic, `PAGE_FETCH = 200`, filter behavior, RPC/query behavior, page ordering, 240px board hold, and all analytical tokens.
- Use component-local disclosure state only; no URL or persistence changes.
- Reuse `KICKER`, `A`, `ListTerminalRow` geometry, and the existing localized course-count copy; add no colour or locale namespace.
