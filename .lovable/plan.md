# E2: Multi-feat rounds

## Scope
Strengthen existing Explore round cards without changing their size, stream shape, ranker configuration, or data sources. No SQL, RPC, hero-board, schedule, full-leaderboard, round-trace, or feat-board counting changes.

## Implementation
- Add one shared rank-ordered feat collector for ace, albatross, eagle, birdie haul, and bogey-free facts. It will preserve each count, return at most the top two for prose and compact markers, and prevent one feat kind suppressing another.
- Rework round feat headlines so a single ace/albatross/eagle may retain its uniquely known hole, while counts above one use localized plural copy and never enumerate holes. Two feats share one localized joiner and one round/to-par clause.
- Add the required singular/plural and joiner keys in all six course locale files, preserving all existing singular keys and using each locale's plural suffixes.
- Update board-row feat markers to accept counts and show the top two within the existing text lane; keep the score column fixed and allow only marker text to truncate at 320px.
- Give the existing callout panel three strict visual tiers without changing its geometry: INK for birdies, bogey-free, or one eagle; GOLD for one ace, one albatross, or two-plus eagles; TOP only for two-plus aces, two-plus albatrosses, or ace plus albatross.
- Apply the same tier rules to feat chips, including GOLD for two-plus eagles. Leave the existing trace dots and colours untouched.
- Make client notability count-aware with bounded within-band bonuses: repeat feats lift above single-feat peers, eagle counts remain below albatross/ace bands, and all bonuses saturate so arbitrary counts cannot overpower course-record consequence weight. Keep `explore_config` weights unchanged.

## Verification
- Add fixtures for one eagle, two eagles, one ace, two aces, ace plus albatross, and ace plus albatross plus two eagles.
- Assert each fixture's complete headline, callout tier, and board marker; assert every richer fixture is not shorter than its single-feat baseline.
- Add scoring assertions for duplicate lift, strict tier ceilings, and the bounded relationship to a course record.
- Run focused tests and measure the two-feat board row at 320px, confirming the score column does not move and the second marker truncates cleanly if needed.
- Report all six fixture outcomes, added locale keys, the bounded ranking rule, row measurements, callers, contradictions, and any runtime/auth limits.
