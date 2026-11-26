# Brief 32 — complete (both authorized stops retained below)

## Implemented, not verified complete
- CoursesBrowsePage adds ClbhouzTenSection immediately after StandoutRoundsSection and before LatestHolesSection in the existing BLEED wrapper, with a clbhouzTen PageLoadGate readiness ID.
- Public chart hook uses get_top_ten_chart, ['clbhouz-ten', cohort, limit], ten-minute stale time. The existing generated RPC signature was already present and was not edited.
- Everyone admission requires three rows; Pros eligibility requires at least five voters and three Pros rows. Rail, movement, points/tens/story, ticks and cohort reset are implemented.
- Reusable ClbhouzTenSheet accepts cohort, optional highlightCourseId, controlled open/onOpenChange; requests 50 rows and links to course pages.
- Shared floor-rounded geometry follows Ben's ruling: width floor(.74 × (container width − 32)), height floor(1.22 × width). Tests encode 390 → 264 × 322 and 320 → 213 × 259.
- Styles and semantic surface tokens live in src/styles/clbhouz-ten.css. Component headers record module ownership; no unrelated architecture rules were changed.

## Stop — exact tool evidence
Command: `bunx vitest run src/test/brief32ClbhouzTen.test.tsx`
Result: **10 failed / 10 tests; 1 failed file**. Every case fails in beforeEach, before its assertions execute:

```text
TypeError: Cannot redefine property: ResizeObserver
 ❯ src/test/brief32ClbhouzTen.test.tsx:15:5
     15|  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} …
```

src/test/setup.ts already defines window.ResizeObserver with Object.defineProperty; the new local global replacement conflicts with that existing setup. No test fix, assertion change or rerun was made after the failure. The test also redundantly replaces matchMedia; its setup should likewise reuse the existing shared mock rather than attempting a second global definition.

## Test accounting
- Last passing full-suite baseline: **10,695 tests / 932 files** (Brief 31).
- Added src/test/brief32ClbhouzTen.test.tsx: **10 cases / 1 file**, resulting expected scope **10,705 / 933**, not an executed or passing full-suite total.
- Names: floors a 390 container to 264 × 322; floors a 320 container to 213 × 259; requires three Everyone rows; requires five Pros voters and three Pros rows; maps every movement and omits first-week movement; renders no section below the Everyone threshold; renders no toggle at four voters and the toggle at five; uses seven cards and seven ticks and resets to one on cohort switch; consumes canonical heading roles without a week stamp; marks exactly the requested course in the reusable sheet.
- No existing tests deleted, renamed, rewritten or assertion changes. Full-suite shards not started because of the stop.
- Latest automatic preview diagnostic: `build OK`, 2026-11-26T08:00:43Z. No manual build/typecheck performed.

## Outstanding
- Await authorization to remove only the redundant local ResizeObserver/matchMedia global stubs and use shared setup; assertions stay unchanged.
- Requested 320/375/390 browser measurements, 390/320 resting/swiped/Pros/sheet captures, live course-navigation/readback and full-suite checks not performed.
- The seven-card hint and exact movement colors are implemented but their requested detailed checks remain unverified; no completeness claim.
- No security scan or Fix all action was invoked; no security findings fetched in this request.

## Files changed
- roadmap.md
- src/components/courses/CoursesBrowsePage.tsx
- src/components/courses/browse/clbhouzTenRules.ts
- src/components/courses/browse/useClbhouzTenChart.ts
- src/components/courses/browse/ClbhouzTenSheet.tsx
- src/components/courses/browse/ClbhouzTenSection.tsx
- src/styles/clbhouz-ten.css
- src/test/brief32ClbhouzTen.test.tsx
- .lovable/reports/brief32/report.md

No SQL, migrations, deployment, triggers, schedules, feed_config edits or round_pool_cap changes.

## Authorized continuation — 26 November, 08:05 UTC
Ben authorized removal of only the redundant local ResizeObserver/matchMedia global replacements. Both were removed; every assertion remains unchanged, including `expect(chartCardSize(390)).toEqual({ width: 264, height: 322 })` and `expect(chartCardSize(320)).toEqual({ width: 213, height: 259 })`. These pure container-size tests do not depend on ResizeObserver delivery.

Command: `bunx vitest run src/test/brief32ClbhouzTen.test.tsx`
Result: **10/10 passed, 1/1 file**. Test count before and after setup-only change: 10 → 10; no renamed/deleted/rewritten tests.

### Second stop — unchanged page tests
Command: `bunx vitest run src/test/coursesWholePageHold.test.tsx src/test/coursesBrowseHighestRatedRemoval.test.tsx src/test/coursesStandoutRounds.test.tsx`
Result: **40 passed / 5 failed / 45 tests, 1 passed / 2 failed / 3 files**. No rerun or fix after this unexpected failure.

```text
Error: useNavigate() may be used only in the context of a <Router> component.
 ❯ ClbhouzTenSection src/components/courses/browse/ClbhouzTenSection.tsx:37:20
```
Failed cases:
- coursesBrowseHighestRatedRemoval.test.tsx: the Courses page never renders "What members rate highest".
- coursesBrowseHighestRatedRemoval.test.tsx: the page gate opens once the remaining sections report ready.
- coursesWholePageHold.test.tsx: holds the list and all sections together until the list is ready, preserving the list outside section bleed.
- coursesWholePageHold.test.tsx: the signed-out fallback omits the circle shell.
- coursesWholePageHold.test.tsx: the guest fallback shows the Latest holes shell and the signed-in fallback the circle shell.

Both page tests stub every previous section with a gate-ready reporter, but have no stub for the newly mounted countdown; the real component thus needs a Router and starts a chart read. Proposed authorization: add only its matching section stub and readiness fixture entry, preserving all assertions/counts; no source change to accommodate tests.

### Concurrent real-page observation
A fresh signed-out browser opened `http://localhost:8080/courses` at 390×854. The public live countdown rendered ten real course cards, led by Royal County Down Golf Club (Championship), 50 points, six tens. No page errors were observed. Pros toggle was absent. An initial real-page capture is saved at `captures/real-page-390-initial.png`; this is not a substitute for the requested fully settled section/rail/sheet captures. The masthead was still showing its existing shell, and the card footer sits near the floating navigation in this initial viewport. No course tap or full chart sheet was exercised before the second stop.

Latest automatic preview check: `build OK` at 2026-11-26T08:06:05Z. Full-suite baseline stays 10,695/932; expected scope 10,705/933 remains unexecuted. Await page-test-stub authorization; remaining browser captures, detailed hint/color checks and four sequential full-suite shards remain pending.

## Final completion — 26 November 2026
Both reported stops were resolved only after Ben's explicit authorization. Brief 32 implementation and requested checks are complete.

### Authorized page-test changes
- coursesWholePageHold.test.tsx: added the matching ClbhouzTenSection readiness stub and `clbhouzTen` in the ready fixture. **3 → 3 tests**, every assertion byte-for-byte unchanged.
- coursesBrowseHighestRatedRemoval.test.tsx: added the matching readySection('clbhouzTen') stub. **3 → 3 tests**, every assertion unchanged.
- brief32ClbhouzTen.test.tsx: removed only the authorized redundant global replacements. Existing ten cases and assertions unchanged. Added three missing original-Brief-32 checks: `prints the requested seven-card hint`; `binds up and down movement pills to the signed-off colors`; `omits every movement pill for null first-week movements`. **10 → 13 cases**; these additions do not replace a previous assertion.
- No tests deleted, renamed or rewritten; no assertion weakened to pass. The exact geometry assertions remain **264 × 322 at a 390 container** and **213 × 259 at a 320 container**.

### Final source refinement
The shell title now consumes the same canonical title role and actual wrapping text geometry instead of a fixed 44px placeholder. The no-toggle eyebrow row no longer reserves an extra 21px. This preserves the signed-off heading gap and visible-line limits at 320/375/390. No neighboring section or shared token was restyled.

### Commands and results
Focused final command:
`bunx vitest run src/test/brief32ClbhouzTen.test.tsx src/test/coursesWholePageHold.test.tsx src/test/coursesBrowseHighestRatedRemoval.test.tsx src/test/coursesStandoutRounds.test.tsx`
**58/58 tests, 4/4 files passed**.

Final full-suite shards executed one after another, never concurrently:
| Command | Passed tests | Passed files |
| --- | ---: | ---: |
| `bunx vitest run --shard=1/4` | 2,563 | 234 |
| `bunx vitest run --shard=2/4` | 2,559 | 234 |
| `bunx vitest run --shard=3/4` | 2,766 | 234 |
| `bunx vitest run --shard=4/4` | 2,820 | 231 |
| **Total** | **10,708** | **933** |

Last reported full-suite baseline **10,695 / 932** → final **10,708 / 933**: **+13 tests / +1 file**, entirely the new brief32ClbhouzTen.test.tsx. Existing file case counts are unchanged. Two preliminary shards (2,560 and 2,559) passed before the three final requested coverage additions; they are not counted as the final full-suite run. Final shards restarted at 1/4 after all edits.

### Live browser proof, not fixture data
Fresh public signed-out contexts exercised the real Courses page and RPC at **390, 320 and 375 CSS px**. No guest account was minted and no credentials were used.
- Measured cards: **390 → 264 × 322; 320 → 213 × 259; 375 → 253 × 308**.
- Actual live Everyone response: 19 voters, **3 Pros voters**. Pros toggle is correctly absent because its minimum is five; no disabled toggle is shown. Eligible-switch behavior is covered by jsdom with the original three-row/five-voter condition.
- Real ten-course rail starts at Royal County Down (50 points, six tens). Tick four was tapped, native scrolling was allowed to settle, and its active tick/card position was checked.
- Full chart opens and reads **50 real rows**. Each tested sheet-to-course tap navigated to `/courses/8df6dde5-49e2-4b1d-bbec-bd5f6e3c2b66`. No page errors or document-width overflow were observed at any tested width.
- Screenshots visually inspected: one-/two-line headings, portrait geometry, next-card peek, ticks/hint, ellipsised story/name boundaries and sheet row grammar. Final captures position the section clear of floating navigation; the initial capture remains explicitly initial evidence only.

### Requested captures
All are real live public-page captures, not fixtures:
- `captures/live-390-card1.png`
- `captures/live-390-card4.png`
- `captures/live-390-sheet.png`
- `captures/live-320-card1.png`
- `captures/live-320-card4.png`
- `captures/live-320-sheet.png`
- Additional 375 checks: `captures/live-375-card1.png`, `captures/live-375-card4.png`, `captures/live-375-sheet.png`.
- Pros appearance: no live toggle capture because **pros_voters = 3**, below the required five-voter threshold, as permitted by the brief.

The reusable highlight behavior is verified by jsdom. Live movement pills are absent in this first-week data (null movement); the exact up/down colors, mapping and no-pill rule are covered by the new tests. No live qualifying Pros cohort or non-null movement is claimed.

### Final file inventory
Production: CoursesBrowsePage.tsx; ClbhouzTenSection.tsx; ClbhouzTenSheet.tsx; clbhouzTenRules.ts; useClbhouzTenChart.ts; src/styles/clbhouz-ten.css.
Tests: brief32ClbhouzTen.test.tsx; coursesWholePageHold.test.tsx; coursesBrowseHighestRatedRemoval.test.tsx.
Documentation: roadmap.md; this report and captures.

No SQL, migrations, database writes, deployment, triggers, schedules, feed_config changes or round_pool_cap changes. Generated Supabase types remained untouched because the RPC signature was already present. No security Fix all action or security remediation was performed; no security findings were retrieved in this request.

## Closed — 26 November 2026
- Brief 32 closed by Ben on 26 November 2026. Implementation, both authorized stops and all requested checks are recorded above; no further source, test or documentation change is pending.
- Final full-suite total stands at **10,708 tests / 933 files** against the Brief 31 baseline **10,695 / 932**: **+13 tests / +1 file**, entirely the new `src/test/brief32ClbhouzTen.test.tsx`. No existing test was deleted, renamed or rewritten, and no assertion was weakened.
- Live public proof covers 390/320/375 card geometry (264 × 322, 213 × 259, 253 × 308), the ten-course rail, tick four, the 50-row sheet and sheet-to-course navigation. Pros presentation is not claimed live: the public dataset had **3 Pros voters**, below the five-voter minimum, so the toggle is correctly absent. Live non-null movement is not claimed: first-week movement is null, and the up/down colors, mapping and no-pill rule are covered by tests.
- Reusable-sheet highlighting is verified in jsdom, not by a live highlighted-row capture.
- No SQL, migration, database write, deployment, trigger, schedule, `feed_config` edit or `round_pool_cap` change was made in this brief; generated Supabase types were untouched because the `get_top_ten_chart` signature already existed. No security scan, findings fetch or remediation was performed.
