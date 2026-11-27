# Briefs 45 and 46 — Close-out

Commit under test: `4a0fb0953f` (working tree clean before the run).

## Clean build

`rm -rf dist node_modules/.vite && npx vite build` — exit 0, "built in 1m 38s".
Only the pre-existing rollup chunk-size warnings (maps, index, shareWordmark,
bootstrap, generateCategoricalChart). No errors.

## Four sequential shards

Each shard ran once, as its own command, in order 1 → 2 → 3 → 4. Full
stdout/stderr retained at `/tmp/shards4546/shard-{1,2,3,4}.log`.

| Command | Files | Tests | Failures |
| --- | --- | --- | --- |
| `npx vitest run --shard=1/4` | 237 | 2,583 | 0 |
| `npx vitest run --shard=2/4` | 237 | 2,563 | 0 |
| `npx vitest run --shard=3/4` | 237 | 2,705 | 0 |
| `npx vitest run --shard=4/4` | 237 | 2,904 | 0 |

**Total: 10,755 tests / 948 files, zero failures.**

This matches the Brief 45/46 reported baseline exactly (10,755 / 948), so no
test count moved during the close-out run and no delta needs reconciling.
Shard 4's 2,904 is the same figure as the authorised rerun after the
`forYouBusiness.tsx` move, so the earlier shards-1–3 gap is now closed: all
four shards have run against the final files.

## Process note

Ben accepted the shard 4 fix but ruled that the failure should have stopped the
brief and been reported before the fix was applied. Recorded: an unexpected
test failure stops the work and gets reported first, even when the fix is
obvious.

## Constraints

No SQL run. No migration written or touched. `feed_config` untouched.
`round_pool_cap` stays 30. No security "Fix all" action taken.
