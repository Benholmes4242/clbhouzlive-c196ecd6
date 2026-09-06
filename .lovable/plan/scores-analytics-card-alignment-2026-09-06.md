# Scores analytics card alignment

## Goal
Recompose **How they played** as one course-statistics card beneath the existing catalogue search. The card will use the Course page’s own tee/course-card and analytics blocks, retain the existing empty-state and sample/field gates, identify the filtered low-round window explicitly, and end with **See full course analytics**.

No SQL, RPC, route, filter, board, chart-data, or colour-token changes are required.

## Current findings
- Scores does **not** currently render the Course page’s shape chart. `CourseHolePanel` contains a second implementation with different dimensions and tint normalization. That fork is the source of the visual drift: Scores sends the raw course-relative `0…1` value into the stepped difficulty ramp, while the Course page applies its established `0.06 + 0.94 × position` spread and uses slightly different bar geometry. There is no faded parent wrapper.
- **By par** already uses the shared `ParTypeBars`, but Scores requests its compact presentation; the Course page requests the default presentation. Reusing the Course-page block removes that surface-level difference too.
- `CourseCardPanel` and the top-level `CourseAnalyticsPanels` are already exported. The reusable internals needed for a single embedded card—shape block and hole-by-hole preview—are currently private to `CourseAnalyticsPanels` and must be exposed through a shared composition/API rather than copied.
- The Course page currently previews four holes. Scores explicitly requires six, so the shared hole-by-hole block needs a `previewCount` input while keeping the Course page’s existing default unchanged.

## Implementation

### 1. Move the course name into the card
- Remove the external `HOW THEY PLAYED · {course}` line from `HowTheyPlayedSection`.
- Keep the search field exactly where it is.
- Add the selected course name as the first line inside the analytics card at **15px / 800**, directly below the search field and before the avatar/low-round row.
- Preserve long-name safety with wrapping rather than a single-line section-heading ellipsis; verify at 320pt.
- Keep the existing course photograph/name confirmation in each empty state. Where the photograph currently repeats the name as an overlay, the new card title remains the authoritative title and the photograph remains the identifying media required by the earlier empty-state brief.

### 2. Make the low-round basis explicit
- Derive one label from `filters.window`:
  - `14` → `14-DAY LOW BY {name}`
  - `30` → `30-DAY LOW BY {name}`
  - `90` → `90-DAY LOW BY {name}`
  - `year` → `THIS YEAR'S LOW BY {name}`
  - `all` → `ALL-TIME LOW BY {name}`
- Keep the existing avatar ordering, gross figure, true-minus to-par figure, and filtered `BoardCourseRow` values unchanged.
- Add/adjust English translation keys and matching pseudo-English coverage rather than assembling untranslated user-visible fragments.
- Add a quiet **COURSE-WIDE** basis label before the analytical blocks so the windowed low-round line and the course-wide statistics each state their own basis once. Delete the existing `HOW THE COURSE PLAYS` label entirely.

### 3. Share the Course page’s full analytics blocks
Refactor `CourseAnalyticsPanels` so both surfaces call the same renderers and calculations:

- Export a shared analytics composition (or its existing internal blocks) from `CourseAnalyticsPanels` with presentation inputs for:
  - outer/inset layout,
  - whether the redundant “How it plays” kicker is shown,
  - preview-hole count,
  - terminal action ownership.
- Keep the Course page’s current appearance and four-hole preview as defaults.
- In Scores, use the shared composition with:
  - no “How it plays”/“How the course plays” heading,
  - six preview rows,
  - the same Course-page shape chart geometry, tint spread, par datum, 1/9/18 axis, last-painted labels, figures, field-of-one guard, By-par panel, distribution strip, `HoleRowV2` rows, and All 18 sheet/action.
- Do not retain the duplicated Scores chart, By-par wrapper, distribution-only ending, or `Extremes` substitute once the shared blocks are wired. Remove dead code/imports from `CourseHolePanel`, or retire that component if it has no remaining callers.
- Keep all course-wide calculations sourced from `get_course_hole_analysis` and `get_my_hole_performance`; the applied Scores window must affect only the board row and low-round line.

### 4. Add the Course page’s course card before charts
- Render the existing `CourseCardPanel` after the course title and avatar/low-round row, before course-wide analytics.
- Extend its shared presentation API only as needed for an embedded context (for example, suppressing its page-level outer margin while preserving its internal slope scale, tee rows, selection behavior, full-card sheet, and PAR / RATING / YARDS trio).
- Keep the Course page call site on the same component and preserve its existing layout through default props.
- Render this course card even when there are zero tracked rounds or the hole-detail sample is below the gate, because tee/slope/yardage data is independent of rounds.

### 5. Preserve all three data states and both gates
- **No rounds:** retain the exact photograph/name confirmation and copy: `No one has played {course} yet.` / `Play it and you will be the first.` The course card still renders; no chart blocks render.
- **Below hole-detail gate:** retain the exact existing gate sentence, photograph, filtered round count, and low round when present. The course card renders; shape, By par, distribution, and per-hole rows do not.
- **Viewer-only field:** render the shared Course-page analytics with its existing field-of-one behavior—no FIELD AVG, YOUR AVG, or beat count—while keeping the remaining course statistics.
- Hold rendering until the same required reads settle so unresolved data never flashes as a zero/empty state.

### 6. Replace the terminal action
- Remove the current `View course` row.
- Add one final full-width shared terminal row labeled **See full course analytics**, with chevron, routing through the existing `onCoursePress(courseId)` path.
- Place it after the six-hole preview / All 18 block and ensure nothing follows it inside the card.

## Files expected to change
- `src/components/explore-tab-new/courseled/HowTheyPlayedSection.tsx`
- `src/components/explore-tab-new/courseled/CoursesPlayedSection.tsx`
- `src/components/explore-tab-new/courseled/CourseHolePanel.tsx` (reduce to shared orchestration or remove if unused)
- `src/features/courses/components/holes/analytical/CourseAnalyticsPanels.tsx`
- `src/features/courses/components/holes/analytical/CourseCardPanel.tsx`
- `src/features/courses/components/holes/analytical/HoleRowV2.tsx` only if the preview-count constant/API must be generalized
- relevant `courses.json` locale files for the new low-window and terminal labels

## Validation
- Run focused TypeScript and existing course analytics tests, translation validation, and whitespace checks.
- Compare the same course on Scores and its Course page at 390pt using element screenshots. Confirm matching shape-bar fills/geometry and By-par bars rather than judging only by token values.
- At 390pt measure `data-course-analytics-card` from top to bottom after six collapsed hole rows render, and report the measured pixel height (including the course card and terminal row).
- At 320pt verify the longest available course title wraps without clipping, all hole columns fit, the All 18 control remains reachable, and there is no document-width overflow.
- Exercise all three states where live data permits. If the external Supabase session still prevents authenticated viewer-only verification, report that limitation rather than inferring success.

## Final report
Report:
1. the confirmed fading cause (the duplicated Scores chart’s different tint/geometry path, not a wrapper opacity),
2. which Course-page internals were exported or parameterized,
3. the measured 390pt card height,
4. 320pt title/overflow results,
5. any runtime/auth state that could not be exercised.
