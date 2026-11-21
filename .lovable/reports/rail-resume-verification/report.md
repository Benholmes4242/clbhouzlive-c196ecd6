# Rail shapes — authorised shard-one rerun stopped

The authorised unchanged rerun **did not pass**. The same named `activeRing` case failed again; verification stopped immediately, as required. No test or app file was changed. No second rerun or isolated test run was attempted.

## Command and full output

Executed once:
```sh
./node_modules/.bin/vitest run --shard=1/4
```

Complete stdout and stderr: `.lovable/reports/rail-resume-verification/shard-1.log` (also supplied as a downloadable log).

Start time: 14:47:44 UTC on 21 November 2026. Duration: 281.47 seconds.

## Exact failure

```text
FAIL  src/test/activeRing.test.tsx > WhoToFollowRail > a card without media keeps its figures and its avatar opens the post, not the profile
TestingLibraryElementError: Unable to find role="button" and name "Open Danny Holmes's latest post"
 ❯ src/test/activeRing.test.tsx:202:30
```

## Four shard totals

| Shard | Expected tests | This request |
|---|---:|---|
| 1/4 | 2,352 | 2,351 passed / 1 failed of 2,352; 212 passed / 1 failed of 213 files |
| 2/4 | 2,324 | Not run after repeated failure |
| 3/4 | 2,401 | Not run after repeated failure |
| 4/4 | 2,473 | Not run after repeated failure |

Before and after expected inventory: **9,550 tests / 850 files**, delta **0**. No cases were added, deleted, renamed or rewritten; no assertions changed. The 9,550/850 inventory is supplied/expected, not independently measured by a complete run in this request. Observed shard-one count matches the expected 2,352, but a full passing total remains unverified.

## Captures and first paint

The requested 390px and 320px mixed portrait/landscape region rail and course photo-row captures were **not produced**, following the explicit stop condition. Next-tile visibility after a 252px tile at 320px, rail-only overflow and first-paint widening remain **visually unverified**.

Pending shards 2–4 and captures are blocked by the repeated named failure and the ruling prohibiting further verification after it.