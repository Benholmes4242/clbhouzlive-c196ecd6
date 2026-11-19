# SCORECARD TILE · NET IN THE SCORE ROW — STOP (§3)

No source or test changes. Suite baseline 9,158 unchanged; shards not run.

## Why
§3: NET must come from a read the host already makes (feed value = `gam_round_net.net_score`, via `usePostRounds` → `roundPostItem.ts:100`). Every member scorecard opens through `RoundDetailSheet` (Handicap, Clubhouse, Profile, Rounds, Round page, Amateur, Explore, Wire ticker, messaging share cards/strip). Its reads:
- `useRoundDetail` (WHS `SCORE_SELECT`, src/lib/whs/api.ts:150): adjusted_gross, stableford_points, handicap_differential, handicap_index_at_time — no net, no course handicap.
- `useRoundCourseContext`: rounds here/rank/average/index — no net, no course handicap.
- course id/canonical course, hole field, awards, feat rarity, engagement, reactions, comments — none carry net.

So host `RoundDetailSheet` (and every wrapper through it) cannot supply `net` or `courseHandicap` without a new read. Per brief: no read added, no net computed.

## Options for a ruling
1. Authorise reading `gam_round_net` (net_score + course handicap) by score id in RoundDetailSheet — a client read of an existing table/view, no SQL.
2. Hand the feed's `item.facts.net` through only from feed entrypoints; other entrypoints keep today's row.
