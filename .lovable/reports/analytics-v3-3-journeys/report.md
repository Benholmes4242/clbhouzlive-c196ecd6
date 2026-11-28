# ANALYTICS_V3_3_JOURNEYS

## 1. Files changed with line counts before → after
- `src/features/admin/components/analytics/JourneysLens.tsx`: **82 → 104**. CC3/NUM presentation, pure `biggestDrop`, neutral end-to-end figures, wrapping connectors, true-width capped bars, drop explanation and red tracking-gap treatment.
- `src/test/adminAnalyticsV3Journeys.test.tsx`: **0 → 87**, seven new cases.
- `roadmap.md`: **7 → 7**, current status updated.
- `.lovable/reports/analytics-v3-4-screens/report.md`: close-out added for the previously unfinished Screens task; its historical failure is retained with a superseding authorized close-out. No Screens source or tests changed this turn.
- This six-item report is new. Line counts for both reports are recorded below after writing.

The only app/test files changed for Journeys are the two scoped files. `analyticsUi.tsx`, `analyticsFormat.ts`, `useAnalyticsLenses.ts`, the other three lenses and every existing test remain untouched. Funnel/step order and the tracking-gap condition/copy are preserved. Existing missing-count and missing-denominator rendering remains unchanged.

## 2. Suite totals before and after
Baseline: **10,791 tests / 953 files, zero failures** at `6ae4885609`; see `baseline.md`. No pre-existing failures to carry. The two old skins failures are fixed, as Ben ruled.

Screens close-out on the unchanged preceding-turn tree: **10,797 tests / 954 files, zero failures**. Its six new cases account for the intermediate increase.

Journeys full suite ran sequentially, with no source/test edits between commands:

| Command | Tests passed | Files passed | Failures |
| --- | ---: | ---: | ---: |
| `npx vitest run --maxWorkers=2 --shard=1/4` | 2,603 | 239 | 0 |
| `npx vitest run --maxWorkers=2 --shard=2/4` | 2,564 | 239 | 0 |
| `npx vitest run --maxWorkers=2 --shard=3/4` | 2,727 | 239 | 0 |
| `npx vitest run --maxWorkers=2 --shard=4/4` | 2,910 | 238 | 0 |
| **Total** | **10,804** | **955** | **0** |

Reconciliation against the requested baseline: **+13 tests / +2 files**, entirely:
- `adminAnalyticsV3Screens.test.tsx` (+6): `(a) 30,360 seconds and 62 members shows 8m each; zero members omits each`; `(b) Views uses health mau and shows an em dash for null, zero or loading`; `(c) area chips wrap without horizontal scrolling and active-chip taps return to All`; `(d) Unused and Nobody opened count use neutral ink, not amber`; `(e) routes inherit the normal font and permit wrapping`; `(f) source scan: no heavy or tiny type, amber, ellipsis, horizontal scrolling or monospace`.
- `adminAnalyticsV3Journeys.test.tsx` (+7): all seven cases named in item 3.
- Compared with the Screens close-out, Journeys adds exactly **7 tests / 1 file**. Per-shard movements reflect shard redistribution, not deleted cases.
- No existing test deleted, renamed or rewritten; no assertion changed this turn. Screens' earlier explicitly authorized new-test repairs are quoted in its close-out report.

Focused command: `npx vitest run --maxWorkers=2 src/test/adminAnalyticsV3Journeys.test.tsx src/features/admin/components/analytics/analytics.test.tsx src/test/fixOverflowSource.test.ts` — **30/30 tests, 3/3 files passed**. The existing analytics/tracking-gap and cross-app grid contract tests passed untouched.

Latest source check: `/tmp/observability/build-errors.log`, `2026-11-28T04:52:14Z`: **build OK**. All four full-suite commands exited 0. Logs: `/tmp/journeys-shards/shard1.log` through `shard4.log`; focused log `/tmp/journeys-focused.log`. Existing test stderr diagnostics (for example jsdom canvas support) did not produce failed tests; no new failure occurred.

## 3. New tests, named
All in `src/test/adminAnalyticsV3Journeys.test.tsx`:
1. `(a) 137, 34, 32, 15, 10 picks step 1 and explains the 103 lost` — exact note assertion: `103 lost between joined and connected a handicap, 75% of those who got that far.`; exactly one biggest-drop marker.
2. `(b) 17, 14, 12 picks step 1 at 82% rather than step 2 at 86%` — earlier connector bad, later connector mute.
3. `(c) a rounded tie chooses the earlier step and no qualifying step returns none` — exact and rounded ties, empty input, zero parents/growing steps, no note/marker when none qualifies.
4. `(d) a growing step is a data fault, never the biggest drop, with its true capped bar width` — 100→50→80→120; fault text, one eligible drop, 80% bar rather than parent-clamped 50%, final bar capped at 100%.
5. `(e) end-to-end figures use ink and words use faint, never a conversion tone` — 7% and 100% remain ink; words stay faint.
6. `(f) the tracking gap uses bad rather than amber and keeps muted body copy` — bad title/icon, exact red wash/outline, muted body.
7. `(g) source scan bans heavy or tiny type, amber and conversion tones` — the requested numeric/string guards.

No new react-i18next mock; the tests preserve real module exports via a partial override of the existing journeys hook and use fixture payloads only. No live reads are made by these tests.

## 4. Source-scan patterns and hit counts
Scan target: `JourneysLens.tsx`.
- Numeric `fontWeight:\s*(\d+)` above 700: **0**.
- Numeric `fontSize:\s*([\d.]+)` below 10: **0**.
- `t\.brand`: **0**.
- `t\.warnText`: **0**.
- `endTone`: **0**.
- `convTone`: **0**.
- `rgba\(249,200,116`: **0**.
- Combined test guard `/t\.(?:brand|warnText)|endTone|convTone|rgba\(249,200,116/`: **0**.
- Inline `display: 'grid'`: **2**; `gridTemplateColumns` declarations: **2**. The unchanged cross-app overflow contract passed.

Every rendered numerical surface uses NUM (step counts, conversion/wait strings, end-to-end figure, loss explanation and the figure-bearing tracking-gap body). First fill is `rgba(233,237,243,0.3)`; later fills use CC3.ink. Red is confined to fault/drop connectors and the tracking-gap fault note. Shared LIT is not edited and its amber key is not restored.

## 5. Screenshots / authenticated access
**I cannot reach authenticated admin routes.** `lovable auth-session --json --self` refused with a gateway precondition: this project's connected Supabase backend is user-managed and Lovable cannot mint its tokens. No credentials were requested, no account created, no role changed, no sign-in bypass added.

No authenticated 390/320 Journeys or Screens captures. Exact visual match and 320px horizontal-overflow acceptance remain unverified. No illustrative mock counts were hardcoded into the app.

Data access is unchanged: only the existing `useAnalyticsJourneys()` / `get_admin_analytics_journeys` read. No hook/query/key changes or added network requests in code. Live request behaviour was not browser-verified.

## 6. Brief findings
No contradiction found between the supplied Journeys brief and its signed-off mock for the scoped presentation. The mock's representative funnels have valid positive counts; the brief explicitly adds guarded data-fault/zero-parent handling for other payloads. The shared Panel and Head already have the Health v3 treatment. The brief calls the protected test `analytics.test.tsx`; its actual path is `src/features/admin/components/analytics/analytics.test.tsx`, unchanged and passing.

The earlier Screens ruling correction is recorded in that report's brief-findings item: ban the hidden-scrollbar class in source scan (f), and explicitly authorize removing only that class from ScreensLens despite the earlier test-only scope restriction. Its style object stayed unchanged.

No guest browsing, review wizard, news, round plots, SQL, migrations, migration files, deployed RPCs/edge functions, feed_config, round_pool_cap, native/Median configuration or security Fix all changes. `round_pool_cap` stays 30. Authenticated visual acceptance remains the only unavailable Journeys acceptance check.

Report line counts: Journeys report 0 → 77; Screens report 90 → 127.
