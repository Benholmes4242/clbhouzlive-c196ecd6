# Last year lookup + missing-leaderboard sweep — baseline stop

## Before-change verification

Each shard was executed in its own command, sequentially:

| Command | Passed | Failed | Executed |
| --- | ---: | ---: | ---: |
| `npx vitest run --shard=1/4 --maxWorkers=2` | 2,087 | 0 | 2,087 |
| `npx vitest run --shard=2/4 --maxWorkers=2` | 1,908 | 0 | 1,908 |
| `npx vitest run --shard=3/4 --maxWorkers=2` | 2,049 | 0 | 2,049 |
| `npx vitest run --shard=4/4 --maxWorkers=2` | 1,967 | 1 | 1,968 |
| Total | 8,011 | 1 | 8,012 |

The previous completed full-suite total was 8,005. The intervening board-header work added seven cases in `src/test/boardHeadersNoPosPlayer.test.tsx`, giving 8,012. This request added, removed, renamed or rewrote no tests.

## Unexpected baseline failure — stopped

File/line: `src/test/heroBlocks.test.tsx:104:23`.

Test: `recap board header removal > RecapStandings renders no kicker or Full list link`.

Tool output:

```text
AssertionError: expected 'export function RecapStandings({ tour…' not to contain 'recap-head'

 ❯ src/test/heroBlocks.test.tsx:104:23
    102|     expect(stand).not.toContain('data-recap-full-list');
    103|     expect(stand).toContain('overview.recap.pointsHeading');
    104|     expect(stand).not.toContain('recap-head');
       |                       ^
```

The received source includes the existing `.recap-head-row` added by the board-header work. No repair was authorized or attempted here.

Logs retained at `/tmp/last-year-before-1.log` through `/tmp/last-year-before-4.log`.

## Work not performed

- Prior-year lookup fix and its two regression tests.
- Missing-leaderboard action and its tests.
- Function deployment and one backfill invocation: no return value is available.
- After-change shards: not run because the before-change baseline stopped the task.

Only this report and the roadmap checkpoint were changed. No application code, tests, SQL, migrations, cron, edge deployment, feed configuration, pool cap or native configuration was changed.