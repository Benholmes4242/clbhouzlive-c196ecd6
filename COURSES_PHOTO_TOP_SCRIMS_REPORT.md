# Courses photo cards — authorised fixes complete

## SCRIMS 2 result
All full-suite shards passed: **5,380/5,380 across 516 files**, zero failures. Shards: **1,332 + 1,260 + 1,387 + 1,401**.

Exact commands: `bunx vitest run --shard=$i/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/courses-scrims2/suite/shard-$i.json`, for i=1,2,3,4. Focused command is the same four-file command recorded below: **57/57 across 4 files**.

Count reconciliation: expected prior inventory **5,377/516 → 5,380/516 (+3/+0)**. Last executed green full baseline **5,370/515 → 5,380/516 (+10/+1)**. All ten additions are in `coursesPhotoTopScrims.test.tsx`: its original seven cases plus three stack cases below. No case deletions, no renames in SCRIMS 2.

### Authorised test selector: old → new
The shared four-card parameterised test retained all four case names and `expect(layers).toHaveLength(2)` unchanged.
- Old: `children.filter(child => child.style.position === 'absolute' && child.style.inset === '0' || child.classList.contains('latest-hole-scrim'))`
- New: `children.filter(child => child.style.background.includes('linear-gradient'))`
- Why: the old selector counted the inset-0 image as a third layer. The new selector admits only gradients as explicitly authorised.
- jsdom 20 rejects gradient assignments (`style.background` becomes empty). A file-local accessor spy retains React's actual assigned gradient strings while delegating other background values to the original accessor; it is restored after every test. No component changes for the test harness.
- The existing bottom-source assertion now checks `background: SCRIM_STANDOUT` rather than `background: SCRIM_STANDOUT }`, because the authorised `zIndex: 1` field follows it. The exact recipe assertion and two-layer assertion are unchanged. Latest courses' literal 45% assertion is unchanged.

`coursesPhotoTopScrims.test.tsx`: **7 → 10 cases**. Added:
- `Latest holes video uses an isolated media-0 scrim-1 text-2 stack`
- `Latest holes image uses an isolated media-0 scrim-1 text-2 stack`
- `Latest courses large video and small posters keep overlays above isolated media`

### Places changed and player audit
- **Latest holes:** isolated card; new absolute media wrapper at 0 contains image or shared player; direct shared player host is assigned 0 by local CSS. Both scrims at 1; figure, caption and duration chip at 2. Existing geometry and image cover fitting preserved.
- **Latest courses big tile:** isolated tile; shared player contained by absolute media wrapper at 0; image alternative at 0; original 45% bottom and 40% top scrims at 1; shot count/label and course/credit at 2.
- **Latest courses small tiles:** still poster-only, no inline player added. Isolated cells, images at 0, video disc and existing +N overlay at 2; dimensions and content unchanged.
- **PhotoFigureCard and HardestSection:** audited; neither renders an inline video, so no further stacking changes required.
- `HoleInlineVideo.tsx` is unchanged. Its host (`return <div ref={hostRef} className="absolute inset-0">`, line 55) declares no z-index above 0. The nested video has opacity/transition but cannot escape the local media wrapper's 0 stacking context.
- No new module or shared-player ownership change introduced; local stack stays owned by the two rail card implementations.

### Live caption verification
At `http://localhost:8080/courses`, the actual first Latest holes card is a **0:11 video** and visibly shows **2 / PAR 5 · 584 YDS / Tralee Golf Club / Andrew Yetzes · Apr 2026**. This resolves the earlier unknown caption cause as an overlay-stacking fault, not absent metadata; no row repair or fallback was necessary.

Browser computed styles confirmed card `isolation: isolate`, media wrapper 0, actual player host 0, both scrims 1 and all three overlay groups 2, each positioned. The element screenshot `/tmp/browser/courses-scrims2/first-hole.png` was inspected and shows all labels over the video. No guest layer covered this card. This is actual public-preview evidence, not authenticated membership or persistence proof.

Latest automatic preview signal: **build OK at 2026-11-01T17:41:30Z**. No manual build/typecheck run. No current/pre-existing suite failures; historical News failures listed below all pass in this full run. All protected backend/configuration/native scope remains untouched.

---
## Historical first-pass stop (resolved by SCRIMS 2)

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