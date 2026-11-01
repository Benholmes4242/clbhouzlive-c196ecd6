# Courses photo cards — stopped on new test failure

## Diff
- `src/styles/photoScrim.ts`: adds `SCRIM_STANDOUT_TOP`, exactly `linear-gradient(180deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 40%)`, with the requested one-line comment. `SCRIM_STANDOUT` and all other tokens unchanged.
- `PhotoFigureCard.tsx`, `HardestSection.tsx`, `LatestCoursesSection.tsx`, `LatestHolesSection.tsx`: import and mount an absolute inset-0 top layer after the existing bottom layer and before figure text. The Latest courses 45% bottom gradient remains verbatim; other bottom layers remain verbatim. No small mosaic tile changes.
- `LatestHolesSection.tsx`: only its kicker changes from “Hole by hole” to “Through members' eyes”. Title and Latest from the courses kicker unchanged.
- Test addition and single authorized kicker-test update below; roadmap and project preference memory updated.
- No SQL, migrations, migration files, deployed RPC/edge changes, feed_config changes, pool-cap changes, native/Median configuration changes, or News changes.

## Captionless video investigation
The rail renders `.latest-hole-name`, course name and member/added-month credit outside the image/video branch. There is no video-only condition dropping the caption. `HoleInlineVideo` renders a shared absolutely positioned media host; it does not conditionally suppress its sibling name block.

The new fixture test, **“an eleven-second video retains course and member/date text beside its shared player”**, passed with Tralee Golf Club / Andrew Yetzes · Apr 2026 and the 0:11 glass duration chip. This establishes the populated-data render path, not the state of the user's specific live first row or its visual stacking in playback.

The read-only investigation did not retrieve the specific live row. Its id and supplied course/member fields are therefore **unverified**; missing data cannot honestly be declared the cause. No caption fix, upstream modification, or invented fallback was made. Actual row identification and live caption visibility remain outstanding.

## Test changes: old → new
`src/test/latestHolesSection.test.tsx`: 23 → 23 tests. One renamed/updated case under this brief's explicit kicker change:
- **Old name:** `the kicker reads "Hole by hole"`
- **Old assertion:** `expect(screen.getByText('Hole by hole')).toBeInTheDocument()`
- **New name:** `the kicker reads "Through members' eyes"`
- **New assertion:** `expect(screen.getByText("Through members' eyes")).toBeInTheDocument()`
- **Why:** the brief changes exactly this kicker. The `Latest holes` title assertion remains unchanged. No other existing assertion changed; no tests deleted.

New `src/test/coursesPhotoTopScrims.test.tsx`: 0 → 7 tests:
- `exports the exact 180-degree 40-percent top recipe`
- `preserves the canonical 32-percent bottom recipe`
- `PhotoFigureCard mounts its top layer before its figure and keeps the bottom`
- `HardestSection mounts its top layer before its figure and keeps the bottom`
- `LatestCoursesSection mounts its top layer before its figure and keeps the bottom`
- `LatestHolesSection mounts its top layer before its figure and keeps the bottom`
- `an eleven-second video retains course and member/date text beside its shared player`

## Executed checks and stop
Command:
`bunx vitest run src/test/coursesPhotoTopScrims.test.tsx src/test/latestHolesSection.test.tsx src/test/latestCoursesSection.test.tsx src/test/coursesRegularsFive.test.tsx --maxWorkers=2`

**53 passed / 1 failed / 54 executed across 4 files.** Existing files pass: Latest holes 23/23, Latest courses 21/21, Regulars 3/3. New file 6/7.

Exact failure:
```text
FAIL src/test/coursesPhotoTopScrims.test.tsx > Courses photo top scrims > LatestCoursesSection mounts its top layer before its figure and keeps the bottom
AssertionError: expected [ …(3) ] to have a length of 2 but got 3
❯ src/test/coursesPhotoTopScrims.test.tsx:52:20
52| expect(layers).toHaveLength(2);
```
The selector counts the absolutely positioned inset-0 image along with the two gradient divs. This is a newly authored test-selector fault, not proof of a third scrim. Per the stop rule, the assertion/selector was **not corrected**, no rerun occurred, and full shards were not started.

Last verified full suite: **5,370/5,370 across 515 files**. Expected inventory after these additions: **5,377 tests across 516 files**, +7/+1 solely this new file; no losses. This is an inventory expectation, **not a completed full-suite result**.

Latest automatic preview signal: **build OK, 2026-11-01T17:34:09Z**. No manual build or typecheck run.

## Historical News failures — not current failures
The brief refers to three previously existing failures in `overviewNewsRebuild.test.tsx`:
- `writes after one second half visible and holds the first baseline`
- `writes after one second half visible and holds the previous baseline`
- `visibility below half cancels the pending baseline`

Their historical error was `TypeError: Cannot redefine property: IntersectionObserver`. The approved direct-assignment correction already resolved them before this brief, as recorded in `TOUR_NEWS_OBSERVER_FIX_REPORT.md` and the 5,370/5,370 baseline. No News file was changed or rerun here; they cannot be represented as current pre-existing failures.