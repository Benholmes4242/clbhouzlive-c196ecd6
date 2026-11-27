# ANALYTICS_V3_2_BEHAVIOUR — report

## 1. Files changed (lines before → after, against 6c5afb1c9a)
- src/features/admin/components/analytics/BehaviourLens.tsx: 156 → 184 (four panels rebuilt; liftTone unchanged; new exported helpers busiestLabel, shareColour, SHARE_COLOURS, ELSE_COLOUR)
- src/test/adminAnalyticsV3Behaviour.test.tsx: new, 91

## 2. Suite totals (npx vitest run --maxWorkers=2 --shard=N/4, four sequential commands)
Before (6c5afb1c9a, ANALYTICS_V3_1 close): 10,761 tests / 949 files.
After: shard 1 2,597/238, shard 2 2,557/238, shard 3 2,719/238, shard 4 2,895/236 = 10,768 tests / 950 files, 0 failures.
Delta +7 tests / +1 file = src/test/adminAnalyticsV3Behaviour.test.tsx (seven tests below). Shard 3/4 per-shard counts moved because the new file reassigned test files between shards; the totals reconcile. No test changed, renamed or deleted. No pre-existing failures. analytics.test.tsx (including the 61/41 case) and fixOverflowSource.test.ts pass untouched.

## 3. New tests
(a) a 5-user row shows small sample, is dimmed and faint-toned at 1.3×
(b) 1.5× with 20 users is good-toned, 0.7× bad-toned
(c) busiest slot 10 Wednesday and slot 11 rollover
(d) weekend sub reads 29% if every day were equal
(e) Opened in 24h is not green and shows 25 of 60 rounds
(f) Everything else takes the track colour and no share colour is amber
(g) source scan: no weight above 700, no size below 10, no amber, no okText

## 4. Source-scan hits (BehaviourLens.tsx)
fontWeight > 700: 0. fontSize < 10: 0. t.brand: 0. t.okText: 0. rgba(255,168,58: 0.

## 5. Screenshots
None. I cannot reach authenticated admin routes from the sandbox, so acceptance A (mock match at 390/320, no 320 overflow) is not visually verified.

## 6. Brief findings
No contradiction found between the brief and the mock. Notes: every display 'grid' in the file declares gridTemplateColumns; rhythm cells are plain blocks (display block), not grids. The "Everything else" bar segment now uses its percentage width like the mock rather than the old flex fill.

No SQL, no migrations, no RPC/edge function edits, feed_config untouched, round_pool_cap 30, no native config changes.
