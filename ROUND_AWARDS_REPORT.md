# Signed-off round awards

Both uploaded references are identical. Awards now appear after handicap on score-led feed round cards, with canonical overlapping gold/silver/bronze marks, a 17px total and the existing AWARDS label. The small-figure gap is 18px when present and stays 22px otherwise. No new reads; standard/featured cards, plots, fixed feat artwork and behavior remain unchanged. No new negative letter-spacing.

## Changed files
- `src/features/explore-magazine/ExploreCard.tsx`: conditional awards cell using the existing batched medals prop.
- `src/features/explore-magazine/AwardCluster.tsx`: opt-in `figureSize`; existing sizes and canonical marks remain unchanged. Ownership is documented in its header.
- `src/test/cb111RoundScoreLed.test.tsx`: seven added regression cases covering total/order, single gold, absent tiers/overlap, undefined/zero counts, missing handicap and standard-card default sizing. Existing cases/assertions unchanged; none deleted or renamed.
- `roadmap.md`: task and verification status; reconciled the completed ST1 entries with its previous report.
- `ROUND_AWARDS_REPORT.md`: this report.

## Verification
- Command: `bunx vitest run --maxWorkers=2`.
- Before: **4,498 passed / 4,498 total across 462 files**.
- After: **4,505 passed / 4,505 total across 462 files**. Delta **+7**, entirely from `cb111RoundScoreLed.test.tsx` (12 → 19). No failed tests, pre-existing or new.
- First foreground invocation hit the sandbox's 600-second timeout with no failed cases. A fresh uninterrupted full run passed in 669.29 seconds, exit 0.
- Automatic preview build: **build OK**, latest observed entry `2026-10-30T08:22:59Z`.
- Chromium fixture imports the real ExploreCard and AwardCluster with real providers and sample counts, without modifying application routes. All-three tiers, single gold and zero-awards rows fit at **375, 390 and 430px**: scroll width equals block width at every size, with no overlap between leading figure and right group. Totals are 4/1/absent, 17px when present, gaps 18px/22px. Tap callback succeeded; no page errors in the successful fixture. Screenshot inspected at 375px; screenshots retained under `/tmp/browser/round-awards/`.
- Live authenticated feed/readback remains unverified: `external_unmanaged` session. Sample-data rendering is not authenticated end-to-end verification.
- Existing preview telemetry included an unrelated `StorageApiError: mime type image/avif is not supported`; no upload code was changed.

No SQL, migrations, deployed RPC/edge edits, feed_config, round_pool_cap, native or Median changes.