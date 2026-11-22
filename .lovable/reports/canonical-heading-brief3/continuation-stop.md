# Brief 3 continuation: stopped verification

## Result

Stopped immediately after shard 4 failed. No app or test files changed during this continuation, no reruns, and the share-image follow-up was not started. No SQL, migrations, edge-function changes or feed_config changes.

## Four sequential commands

Each ran as a separate command with complete stdout/stderr retained in `logs/resumed/shard-N.log`:

| Command | Passed | Failed | Files |
| --- | ---: | ---: | ---: |
| `./node_modules/.bin/vitest run --shard=1/4` | 2,447 | 0 | 220 |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,474 | 0 | 220 |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,457 | 0 | 220 |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,551 | 1 | 218 |
| Total | **9,929** | **1** | **878** |

Before and after this continuation: **9,930 tests across 878 files**, delta **0**. The previous Brief 3 run also executed 9,930 tests with 9,929 passing and one failing; its sole failure was the two 750 declarations. Those declarations are now 700, but the already-strengthened guard fails on other findings. Last fully passing baseline remains 9,930/9,930 across 878 files. No tests were deleted, renamed or rewritten in this continuation; no assertion changes.

## Exact stop

`src/test/weightCanonSweep.test.ts:86:60`

Runner: `AssertionError: expected [ …(225) ] to deeply equal []`

Failing case: `Weight canon in completed app-wide scopes > every clean scope uses only 400, 500, 600 and 700 in all five forms`.

Assertion: `expect(CLEAN_SCOPES.flatMap(walk).flatMap(violations)).toEqual([]);`

The full diff is in the shard-4 log. Its 225 entries include:

### Five actual numeric-weight findings newly caught

| File:line | Declaration |
| --- | --- |
| `src/features/tourhub/overview/sections/OnTheCourse.tsx:527` | `fontWeight: 300` |
| `src/features/tourhub/overview/sections/OnTheCourse.tsx:700` | `fontWeight: 300` |
| `src/features/tourhub/overview/tokens.ts:117` | `fontWeight: 200` |
| `src/features/tourhub/players-v2/RankedPlayerRow.tsx:79` | `fontWeight: 200` |
| `src/components/profile/handicap/whs/sections/round-card/RoundCardShell.tsx:116` | `fontWeight: 200` |

None were fixed. They are outside the weight-only 800/900-to-700 edits and the two expressly authorised 750-to-700 changes.

### 220 shorthand findings are not reliable weight counts

The strengthened guard applies its canvas-font shorthand matcher to every string, including spacing and shadows. Examples from the runner:

- `src/features/tourhub/_shared/tokens.ts:167`: `GOLD_GLOW = '0 0 24px rgba(...)'`.
- `src/features/tourhub/components/EditorialEmpty.tsx:72`: `margin: '0 0 8px'`.
- `src/features/tourhub/components/TourIsland.tsx:156`: `padding: '0 0 0 8px'`.

These are not font declarations. The guard was not repaired after the failure, per the stop rule. The complete 225-entry list is saved beside this report as `guard-findings.json`.

## Remaining work, not claimed complete

- Brief 3 remaining before/after captures at 390/320 were not taken after this run. Existing captures predate the two 750-to-700 changes and cannot establish their final appearance.
- No fresh figure-column comparison; the existing `figure-widths.json` is empty, so this continuation does not claim that columns did not shift.
- Cannot report zero in every sweep directory: actual newly caught weights remain in Tour and Profile. Final app-wide census was not rerun after the stop.
- Share font remains its prior explicit stack; canonical-stack change and physical iOS exported-font verification are unfinished. This sandbox Chromium run cannot establish which native iOS font an export renders with.
- Saved-image clipping repair and before/after export attachments remain unfinished.
- Follow-up four-shard run and completion commit remain unfinished. This commit records the stop and logs only, not successful Brief 3 completion.