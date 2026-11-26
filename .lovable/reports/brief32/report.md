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
