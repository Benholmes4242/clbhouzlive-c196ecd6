# Brief 32 — stopped on unexpected test setup failure

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
