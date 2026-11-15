# Tour slot final-round kicker

## Changes
- `src/features/clubhouse-tour/TourSlot.tsx`: only the live photo kicker now uses `t('overview.hero.finalRound')` when `round === roundsFromSchedule(event.start_date, event.end_date)` (via the existing `totalRounds`). Every other round retains `Round ${round}`. The header's `● LIVE Round 4` is unchanged; no layout or other-state changes.
- `src/test/tourSlotStates.test.tsx`: one added case, “last-round live selects FINAL ROUND in the photo kicker while round 3 of 4 keeps ROUND 3 and the LIVE header is unchanged”. The canonical translation mock remains untouched: the test checks the selected translation key in source, the final-round branch, round-three text and both unchanged LIVE headers rather than inventing mock translations.
- `roadmap.md`: completion and test accounting.
- `.lovable/reports/tour-slot-final-round-kicker.md`: this report.

## Test accounting
Baseline: **8,796**. After: **8,797 executed and passed**, zero failures/skips; 769 test files.
`tourSlotStates.test.tsx`: 13 → 14 cases, the single addition named above accounts for +1. No tests deleted, renamed or rewritten; no other test file changed.

Each shard ran sequentially in its own command:

| Command | Passed tests | Passed files |
| --- | ---: | ---: |
| `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,243 | 193 |
| `bunx vitest run --shard=2/4 --maxWorkers=2` | 2,118 | 193 |
| `bunx vitest run --shard=3/4 --maxWorkers=2` | 2,212 | 193 |
| `bunx vitest run --shard=4/4 --maxWorkers=2` | 2,224 | 190 |
| Total | **8,797** | **769** |

Logs: `/tmp/tour-slot-final-round-shard-{1,2,3,4}.log`.

## Checks and scope
- Preview harness: `build OK`, latest entry `2026-11-15T16:33:13Z`.
- `git diff --check` passed.
- No SQL, migrations, feed_config, round_pool_cap, overview or shared translation changes.
- Live on-screen rendering was not rechecked; the change and unchanged header are verified by the added case and full suite.