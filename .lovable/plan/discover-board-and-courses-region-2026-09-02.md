# Discover board and courses region

## Goal
Rework the governed region below the leaderboard so the board and courses lists share the same ending pattern, while preserving the sticky filter bar, filtering behavior, and existing See All sheets.

## Changes
1. Add a small shared terminal-row control for both lists: full-width, left-aligned KICKER label, right chevron, `A.HAIRLINE` top border, and 14px vertical padding.
2. Replace the board’s centered See All button with that terminal row, preserving its existing sheet action and RPC-derived count.
3. Rebuild the Courses Played masthead as a title plus a two-pair stat rail: total courses and applied-window days (`∞` for All Time), with no rounds figure or title suffix.
4. Add a courses column header row for `COURSE` and `PLAYS TO`; use a fixed `62px` plays-to column and `22px` chevron column.
5. Remove the repeated per-row `PLAYS TO` label, retain the 15px figure and existing color/null formatting, and tighten the collapsed course row height accordingly.
6. Move the courses See All action from the masthead to the list foot using the same shared terminal-row component; continue rendering it only when the filtered total exceeds six.
7. Set the board-to-courses masthead gap to about 30px with no separating rule, while leaving the larger Courses-to-Amateur-News boundary intact.
8. Update the loading skeleton to reflect the revised masthead, column header, and shorter rows without changing data behavior.

## Technical details
- Keep `CoursesPlayedSection` driven only by `BoardFilters`; do not pass or derive the board key.
- Keep `useBoardCourses(..., { limit: 6 })` as the section source and `p_limit: 300` in the existing courses sheet.
- Keep the board and courses sheets as separate sheet implementations because their bodies have different schemas, while continuing to reuse `CourseRow` for course rows.
- Use existing semantic tokens (`A.INK`, `A.BODY`, `A.MUTE`, `A.DIM`, `A.HAIRLINE`) and existing typography/figure tokens; add no hardcoded surface colors.
- Preserve expansion, one-open-row behavior, player loading shells, badges, profile/course actions, and all RPC semantics.

## Verification
- Run the focused TypeScript/test checks selected by the project harness.
- Inspect the live `/explore` DOM and screenshots at the current viewport, including both terminal rows when data is available.
- Measure the collapsed course row before/after values from the implementation and confirm `PLAYS TO` appears only in the column header.
- Confirm the terminal course count still comes from the same filtered `get_board_courses` response as the six visible rows.
