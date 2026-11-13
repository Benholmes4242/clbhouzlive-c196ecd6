# Tour overview skeleton — combined build report

## Results
- Latest four independent commands: `bunx vitest run --shard=1/4 --maxWorkers=2`, then `2/4`, `3/4`, `4/4` in separate commands.
- Passed totals: **2,155 / 2,022 / 2,161 / 2,118 = 8,456**; 745 files, zero failures.
- Baselines: 8,436 before skeleton rebuild → 8,449 (+13 new shell cases) → 8,453 (+4 item-height cases) → **8,456 (+3 final v4 cases)**. No cases deleted.
- Outstanding prior shard 4 was executed before item-height edits: 2,118 passed. Prior recorded shards 1–3: 2,155 / 2,015 / 2,161; aggregate 8,449. Those earlier three totals are historical, not rerun in this report.
- Item-height v3 shards: 2,155 / 2,019 / 2,161 / 2,118 = 8,453.
- Focused final: 33 passed, `bunx vitest run src/test/tourOverviewGate.test.tsx src/test/tourOverviewShellV2.test.tsx --maxWorkers=2`.
- Preview latest build: build OK.

## Visual verification
- Controlled shell rendered with actual app CSS at 390 and 320; scroll width equals viewport width.
- Leaders 190px. Also events round to 357/326/296px; borders 1px/1px/0px, matching actual :last-child rule. Coming rows 82/101/82/100px with final border absent. Two-line last-year area 62px; picks sentence has exactly two bars.
- Uses the real page border selectors, not inferred first/last-event rules.
- Loaded authenticated page comparison remains Ben’s acceptance check; this report does not claim authenticated end-to-end verification.

## New and changed tests across skeleton briefs

### src/test/tourOverviewShellV2.test.tsx
- **round-trips every v4 shape field** — v2 new case (fixture/version updates authorised by v3/v4).
- **clamps scalar counts at their lower bound** — v2 new case (fixture/version updates authorised by v3/v4).
- **clamps bounded scalar counts** — v2 new case (fixture/version updates authorised by v3/v4).
- **expires only after twelve hours** — v2 new case (fixture/version updates authorised by v3/v4).
- **rejects malformed storage** — v2 new case (fixture/version updates authorised by v3/v4).
- **rejects wrong types in every field** — v2 new case (fixture/version updates authorised by v3/v4).
- **rejects future timestamps** — v2 new case (fixture/version updates authorised by v3/v4).
- **ignores v1, v2 and v3 and preserves their keys** — v2 new case (fixture/version updates authorised by v3/v4).
- **keeps lenses separate** — v2 new case (fixture/version updates authorised by v3/v4).
- **records mounted marker counts and measured per-item arrays** — v2 new case (fixture/version updates authorised by v3/v4).
- **renders present bands in page order and omits absent bands** — v2 new case (fixture/version updates authorised by v3/v4).
- **renders exactly every remembered row and item count** — v2 new case (fixture/version updates authorised by v3/v4).
- **contains only neutral surfaces and no svg** — v2 new case (fixture/version updates authorised by v3/v4).
- **rejects every malformed per-item array** — v3 new case.
- **renders the supplied tie, player and situation parts** — v3 new case.
- **renders the supplied coming names and news headline and details lines** — v3 new case.
- **places the story outside the column with a 26px top margin** — v3 new case.
- **rejects malformed v4 picks and Coming next objects** — v4 new case.
- **measures picks sentence, record and Coming next text at reveal** — v4 new case.
- **draws exactly the supplied picks and Coming next lines** — v4 new case.

### src/test/tourOverviewGate.test.tsx
- **fresh shape draws exactly its flagged shells in page order** — stored fixture/marker expectations updated for v2→v3→v4; original gate rule preserved.
- **shape over twelve hours old falls back to hero only** — stored fixture/marker expectations updated for v2→v3→v4; original gate rule preserved.
- **throwing and unreadable storage fall back to hero only** — stored fixture/marker expectations updated for v2→v3→v4; original gate rule preserved.
- **writes actual rendered shape once after reveal** — stored fixture/marker expectations updated for v2→v3→v4; original gate rule preserved.
- **stores all five band counts, including rankings, when every band is present** — stored fixture/marker expectations updated for v2→v3→v4; original gate rule preserved.
- **route skeleton and gate fallback use identical stored shells** — stored fixture/marker expectations updated for v2→v3→v4; original gate rule preserved.

## Renamed/rewritten assertions
- `round-trips every v2 shape field` → v3 → `round-trips every v4 shape field`: `expect(readOverviewShape('pga')).toEqual({ ...full, at: expect.any(Number) })`; authorised breaking storage versions require new fixture fields.
- `clamps every count at its lower bound` → `clamps scalar counts at their lower bound`: old assertion `{ boardRows: 0, leadersRows: 0, alsoEvents: 0, rankingsRows: 0, newsList: 0, comingMonths: [0] }`; array fields now reject malformed inputs rather than clamp counts.
- `clamps every bounded count and limits remembered months to three` → `clamps bounded scalar counts`: old assertion `{ boardRows: 10, leadersRows: 3, alsoEvents: 3, rankingsRows: 5, newsList: 3, comingMonths: [1, 2, 3] }`; v3 arrays have strict length/range rejection.
- `ignores v1 and preserves its key` → `ignores v1 and v2 and preserves their keys` → `ignores v1, v2 and v3 and preserves their keys`: `expect(localStorage.getItem('tour-overview-shape:all')).toBe(old)` retained; obsolete version checks added.
- `records exactly the mounted marker counts and excludes also-week board rows` → `records mounted marker counts and measured per-item arrays`: `expect(readOverviewShape()).toEqual({ ...full, at: expect.any(Number) })`; known rendered heights replace count-only fixtures.
- `stores all five bands true, including rankings, when every band is present` → `stores all five band counts, including rankings, when every band is present`: old expectation `{ ...EMPTY_OVERVIEW_SHAPE, board:true, alsoThisWeek:true, comingUp:true, rankings:true, news:true, at:expect.any(Number) }`; authorised marker counts/arrays/objects replace booleans.
- Gate fixture-only updates retain their assertions: page order `['hero', 'board', 'comingUp', 'news']`; expired/unreadable storage equals `EMPTY_OVERVIEW_SHAPE`; route/gate shell-name equality.
- Once-after-reveal assertion previously `{ board:true, alsoThisWeek:true, comingUp:true, rankings:true, news:true }`; updated to measured v4 fields while retaining exactly-one-write assertions.
- No test deletions; file counts: gate 13→13, shell 0→13→17→20.

## Diff stat — current final follow-up
```text

```

## Diff stat — combined skeleton work (excluding earlier loading fixes)
```text
.../components/overview-v3/overviewShells.tsx      | 196 ++++++++++++++++++---
 .../tourhub/overview/sections/AlsoWeekEvent.tsx    |   2 +-
 .../tourhub/overview/sections/ComingUp.tsx         |   4 +-
 src/test/tourOverviewGate.test.tsx                 |  13 +-
 src/test/tourOverviewShellV2.test.tsx              |  77 ++++++++
 5 files changed, 255 insertions(+), 37 deletions(-)
```
- SQL, migrations, feed_config, queries and readiness unchanged by skeleton follow-ups.
