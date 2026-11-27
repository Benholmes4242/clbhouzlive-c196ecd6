# ANALYTICS_V3_1_HEALTH — report

## 1. Files changed (lines before → after, against 28f20968d3)
- src/features/admin/pages/AnalyticsPage.tsx: 69 → 75 (new LENS_COLUMN on the lens branch, data-analytics-v3; diagnostics branch keeps COLUMN)
- src/features/admin/components/analytics/analyticsUi.tsx: 95 → 95 (Panel/Head/FIG_LABEL/Fig/FooterButton to v3; LIT.track 0.07; LIT.amber removed by ruling)
- src/features/admin/components/analytics/HealthLens.tsx: 198 → 225 (rebuilt, sections 3a–3f)
- src/test/adminAnalyticsV3Health.test.tsx: new, 102

## 2. Suite totals (npx vitest run --maxWorkers=2 --shard=N/4, four sequential commands)
Before (28f20968d3): 10,755 tests / 948 files.
After: shard 1 2,597/238, shard 2 2,557/238, shard 3 2,776/238, shard 4 2,831/235 = 10,761 tests / 949 files, 0 failures.
Delta +6 tests / +1 file = src/test/adminAnalyticsV3Health.test.tsx (six tests below). No test changed, renamed or deleted. No pre-existing failures.
Earlier stop: first run of shard 3 failed `fixOverflowSource.test.ts > FIX_OVERFLOW_1 … all non-test inline grids declare columns …` on the cohort value cell; reported, fixed only after approval by adding gridTemplateColumns 'minmax(0, 1fr)'; test file untouched. All four shards rerun from 1 afterwards.

## 3. New tests
(a) weekly delta reads −2 vs last week so far, mute-toned
(b) range control sits after Weekly golfers and before Active members and calls onRange
(c) lift line reads 1.9× for 76 and 40, absent when not connected is 0
(d) cohort grid has M1–M5, no M0, empty cells carry no number, n 6 row dimmed
(e) Growth reads +18 for 28 vs 10 and ↗ 40% for 28 vs 20
(f) source scan: no weight above 700, no size below 10, no amber

## 4. Source-scan hits (HealthLens.tsx / analyticsUi.tsx)
fontWeight > 700: 0 / 0. fontSize < 10: 0 / 0. t.brand: 0 / 0. LIT.amber: 0 / 0. rgba(255,168,58: 0 / 0.

## 5. Screenshots
None. I cannot reach authenticated admin routes from the sandbox, so no 390/320 captures of the live lens were taken and acceptance A (mock match, no 320 overflow) is not visually verified.

## 6. Corrections to the brief
- Section 2 said the other LIT keys stay, while test (f) bans rgba(255,168,58 in analyticsUi.tsx. Ruling (option 1): LIT.amber deleted; search confirmed no reader, spread or key iteration in src. Other LIT keys unchanged.
- Section 3e's cell spec omitted the grid column declaration the FIX_OVERFLOW_1 contract requires; the cell now carries gridTemplateColumns 'minmax(0, 1fr)'.

No SQL, no migrations, no RPC/edge function edits, feed_config untouched, round_pool_cap 30, no native config changes.
