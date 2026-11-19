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

---
# Build after Ben's ruling (option 1)

- Source: `useRoundNetScores` (the shared gam_round_net reader) now selects `course_handicap` beside `net_score`; `RoundNet` gains optional `courseHandicap`. Same key family/cache; no second reader. RoundDetailSheet calls it once with `[scoreId]` (only while open). Failed/empty read → empty map → today's row; nothing waits.
- CardScorecardSheet: new optional props `net`, `courseHandicap`, `netAllowanceOk`. Nettable = course handicap + allowance + net present; NET (#F8FAFC, no tone) after TO PAR, before POINTS/DIFF; PLAYED OFF dropped when NET shows. Tour unchanged. No net arithmetic in the sheet.
- Allowance: host runs the feed's `feedStrokesReceived` on the settled holes' stroke indexes. Difference to note: the sheet's hole read has no provider `strokes_allowed`, so a NINE-HOLE round (FN1 ruling 4: provider allocation only) is never nettable on the sheet even when the feed shows NET.
- §4 feed cache seeding: not done (optional); NET appears once the read lands.
- Tests: +5 in scorecardTileRedesign.test.tsx (a–e), +2 in new roundDetailNetRead.test.tsx (f, g; static source checks). No existing assertion changed — the existing `['gross','toPar','points','diff','playedOff']` cases pass no net and still hold.
- Shards: 2,246 / 2,269 / 2,289 / 2,361 = 9,165 (9,158 + 7). Typecheck clean. Logs /tmp/net-shard-1..4.log.
