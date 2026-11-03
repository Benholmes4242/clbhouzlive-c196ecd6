# Tournament picks build 2 — two small fixes

## Changes
- `src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard.tsx`: guest availability follows the no-pick upcoming/unlocked guard; guests never render a selected member pick. Existing guest gate callback is unchanged.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/pickInsightRules.ts`: one–ten word tokens are ignored unless the reason mentions the whole word win, won or wins. Existing digit checks remain unchanged.
- `src/test/tournamentPickInsights.test.tsx`: eight new cases; no existing tests deleted, renamed or rewritten.
- `roadmap.md`, this report; project memory requirement and index updated.

## New cases and reconciliation
`tournamentPickInsights.test.tsx`: **44 → 52**, +8:
1. ordinary number words do not invalidate a non-win reason
2. three wins is kept when the checked wins count is three
3. three wins is dropped when the checked wins count is one
4. a digit stroke-margin claim is still dropped
5. guest live renders no pick card
6. guest completed renders no pick card
7. guest locked upcoming renders no pick card
8. guest upcoming renders the card and Pick goes to the guest gate

Full suite before/after: **6,160 / 554 files → 6,168 / 554 files**. All eight added cases are in the named existing test file; no other inventory delta.

## Verification
Focused command: `bunx vitest run src/test/tournamentPickInsights.test.tsx --maxWorkers=2` — **52/52 passed**.

Full-suite commands: `bunx vitest run --maxWorkers=2 --shard=1/4` through `--shard=4/4`.

| Shard | Passed tests | Passed files |
| --- | ---: | ---: |
| 1/4 | 1,578 | 139 |
| 2/4 | 1,507 | 139 |
| 3/4 | 1,529 | 139 |
| 4/4 | 1,554 | 137 |
| Total | **6,168** | **554** |

Zero failures and zero unhandled errors; no pre-existing failure appeared. Complete logs: `/tmp/picks-small-fixes/focused.log`, `/tmp/picks-small-fixes/shard-{1,2,3,4}.log`.

Automatic build **2026-11-03T11:52:05Z — build OK**. No manual build/typecheck run. Guest upcoming card/gate exercised through the real member-band component with test providers; no live-browser end-to-end check claimed. No SQL, migrations, RPC/edge-function edits, feed_config, round_pool_cap or native/Median changes.