# CB99 — Insights on the course

Implemented, but stopped at one new test failure; not accepted as fully verified.

## Diff summary per file
- `src/hooks/useBusinessCourseActivity.ts` (new): reads only `get_business_course_activity` with business ID and picker days; period-keyed query and `keepPreviousData`. RPC errors propagate; no client recounting or privacy filtering.
- `src/components/business/insights/InsightsCourseSection.tsx` (new): available/failed/loading/zero/positive states; trimmed club name; shared change, course-label and date helpers; server split counts, course and regional rows, visitor/repeat note, fine print and Your courses action. Previous card uses its payload's period while a new read loads.
- `src/pages/BusinessInsightsPageV2.tsx`: imports and appends the card after Reviews. Sections 1–7 unchanged.
- `src/index.css`: scoped card styles and two semantic tokens. Requested title tracking `-0.01em` is **not implemented**: environment instruction requires zero tracking for additions. Existing preceding titles untouched. All other stated styling implemented, not browser-verified.
- `public/locales/en/common.json`, `public/locales/en-XA/common.json`: new courseCard copy and singular/plural forms only; existing copy unchanged.
- `src/test/cb99InsightsCourse.test.tsx` (new): 25 cases covering conditional states, counts, shared helpers, query switches and page order. No existing test retargeted, deleted, renamed or rewritten.
- `AGENTS.md`: one ownership pointer to new module headers.
- `roadmap.md`: implementation and exact stop recorded.
- Project memory: retained CB99's signed-off requirements; no technical implementation details stored there.

## Validation
Command: `bunx vitest run src/test/cb99InsightsCourse.test.tsx src/test/cb89InsightsReviews.test.tsx src/test/cb88InsightsEngagement.test.tsx`

Result: **65 passed, 1 failed, 66 total across 3 files**.
- CB99: 24 passed / 1 failed / 25 total.
- CB89 unchanged: 23/23 passed.
- CB88 unchanged: 18/18 passed.

Exact failure:
```text
FAIL src/test/cb99InsightsCourse.test.tsx > CB99 empty and period states > query key and arguments include each picker period; old snapshot remains until settled
AssertionError: expected undefined to be truthy
❯ src/test/cb99InsightsCourse.test.tsx:75:71
```
Failing assertion: `expect(v.qc.getQueryData(['business-course-activity', 'b1', 30])).toBeTruthy();`

The new fixture configures `gcTime: 0` at line 22; once the period changes, inactive cached data is removed. The earlier assertions verifying the visible previous snapshot and the 7/90-day keys passed. No fixture or assertion was altered after the failure, per stop rule.

**Full suite:** not run after this new failure. Last reported full baseline: **3,293 tests / 381 files, zero failures**. Added inventory: **25 cases in cb99InsightsCourse.test.tsx / 1 file**. Candidate total: **3,318 / 382**, not an executed full-suite result. No other test delta.

**Pre-existing failures:** none observed in targeted files; full-suite state unverified this turn.

**Automatic preview build:** `build OK` at `2026-10-26T16:00:43Z`. Standalone typecheck not run under environment policy.

**Browser:** not run after the stop. Auth status `external_unmanaged`; authenticated live course-activity read and click-through remain unverified. No demo verification is presented as live data verification.

No SQL, migrations or migration files, deployed RPC or edge-function edits, feed_config changes, round_pool_cap changes (stays 30), or native/Median configuration changes. No dependency changes or Deno files created.