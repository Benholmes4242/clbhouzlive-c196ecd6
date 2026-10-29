# Review a course — Content height, maximum 85dvh

## Result
- Removed `fullHeight`; the sheet follows the same content-height path as Post or review.
- `.rcs` uses `height: auto` and `max-height: inherit`; `.rcs-content` uses `flex: 0 1 auto`, retaining its scroll behaviour and exact bottom padding.
- A narrowly scoped flex constraint on the existing sheet-content wrapper keeps the header/search pinned while the list scrolls. Shared BottomSheet and keyboard handling are unchanged.
- First nonempty input captures the current content height before query-driven rendering changes. That minimum survives result/loading changes, permits growth, and releases on clear, deletion to empty, or close.

## Tests and counts
Baseline: **4,376 tests / 450 files**, all green from EP4.1 + EP5.

- `bunx vitest run src/test/reviewCourseSearch.test.tsx`: **20/20**.
- `bunx vitest run`: **4,378/4,378 across 450 files**, zero failures; duration 270.65s.
- Delta: **+2 tests, no file-count change**, entirely in `src/test/reviewCourseSearch.test.tsx`:
  - `holds the height captured on the first character through changing results, then releases on clear`: captures 420px once, retains it through result changes, clears it through the clear button.
  - `releases the hold when the field is deleted and measures again on the next first character`: captures 300px, releases on empty input, recaptures 350px.
- **No existing assertion or case changed, deleted, renamed or rewritten.** No pre-existing or new suite failures.
- `python3 tests/browser/test_review_course_search_height.py`: **passed**, retained real-component browser coverage outside Vitest. Uses controlled query-cache rows without hosted writes.
  - Two short one-row lists: sheet `height: auto`, 349px tall; list client/scroll height both 229px, so no stretch or overflow.
  - First-character and empty-result states keep 349px.
  - Thirty search rows: sheet 668.09375px at a 430×786 viewport, within rounding of **85dvh = 668.1px**; list scroll height 2,172px vs client height 548px.
  - Scrolling the list by 500px leaves header/search positions unchanged.
  - Clearing removes the minimum and restores 349px.
- Reviewed short-list and long-list screenshots under `/tmp/browser/review-course-height/`.
- Automatic preview build: **build OK**, `2026-10-29T06:18:59Z`. No manual build or typecheck was run.

## Every changed project file
1. `src/features/composer-flow/ReviewCourseSearchSheet.tsx` — content sizing and first-character height hold; local ownership comment.
2. `src/features/composer-flow/review-course-search.css` — natural height, inherited cap, nonstretching list and scoped flex propagation.
3. `src/test/reviewCourseSearch.test.tsx` — two additional height-hold cases; existing cases untouched.
4. `tests/browser/test_review_course_search_height.py` — retained browser geometry regression.
5. `roadmap.md` — task and completed verification.
6. `REVIEW_COURSE_SEARCH_HEIGHT_REPORT.md` — this report.

Project memory additionally records Ben's settled content-height/typing ruling in `mem://features/post-studio/review-course-search-height` and indexes it in `mem://index.md`.

## Limits and protected scope
Authenticated entrypoint end-to-end verification is unavailable for this external-unmanaged project; controlled real-component geometry is not a signed-in flow check. Native on-screen keyboard behaviour was not exercised; existing keyboard logic was untouched.

No SQL, migrations, migration files, deployed RPC/edge changes, feed_config changes, cap changes, or native/Median configuration changes.