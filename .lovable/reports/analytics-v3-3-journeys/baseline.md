# ANALYTICS_V3_3_JOURNEYS — baseline

## Commit and outcome
Tested unchanged commit `6ae4885609` on 27 November 2026 before any project-file edit for this request.

| Command | Tests passed | Files passed | Failures |
| --- | ---: | ---: | ---: |
| `npx vitest run --maxWorkers=2 --shard=1/4` | 2,604 | 239 | 0 |
| `npx vitest run --maxWorkers=2 --shard=2/4` | 2,569 | 239 | 0 |
| `npx vitest run --maxWorkers=2 --shard=3/4` | 2,723 | 239 | 0 |
| `npx vitest run --maxWorkers=2 --shard=4/4` | 2,895 | 236 | 0 |
| **Total** | **10,791** | **953** | **0** |

All four shards ran sequentially. The initial combined command exceeded the sandbox's 600-second command limit during shard 2; shard 1 had completed successfully. No test failure was reported in the interrupted shard. Shard 2 was rerun separately to completion, followed by shards 3 and 4 separately.

Full logs: `/tmp/journeys-baseline/shard-1.log`, `shard-2-rerun.log`, `shard-3.log`, `shard-4.log`. The interrupted shard-2 output is retained as `shard-2.log`.

## Reconciliation
Approved baseline: 10,791 tests / 953 files. Observed baseline: 10,791 tests / 953 files. Delta: zero tests, zero files. No tests changed, renamed or deleted. No pre-existing failures; the earlier note about `5625650d` was superseded by Ben's ruling.

## Pending brief
The written ANALYTICS_V3_3_JOURNEYS brief and its approved mock are not available in the mounted uploads. The available `analytics_journeys.html` belongs to the older Analytics brief. Ben agreed to upload the requested files; implementation is held until they arrive. This is a baseline record, not a completed implementation report.

No app changes, SQL, migrations, RPC or edge-function edits, feed_config edits, round_pool_cap changes, security Fix all actions, or native/Median configuration changes.