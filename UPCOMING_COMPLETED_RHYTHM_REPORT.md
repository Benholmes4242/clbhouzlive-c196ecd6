# Tour heroes — upcoming rhythm + completed two lines

## Status

Implemented the replacement combined brief. Upcoming THE EVENT and LAST YEAR
share completed spacing tokens; values use board TOT **15px / 700**. Completed
cells have exactly two lines, three columns, 16px small-screen gutters and
0.04em small-screen label tracking. Top-three and every score-bearing completed
figure use the canonical score helper; ink-neutral is opt-in so other boards
retain their existing colours. Negative scores are #E24B3F; even/over are ink.

## Fresh before-change tests

Each command ran separately, one at a time:

| Command | Passed | Failed |
|---|---:|---:|
| `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,084 | 0 |
| `bunx vitest run --shard=2/4 --maxWorkers=2` | 1,907 | 0 |
| `bunx vitest run --shard=3/4 --maxWorkers=2` | 2,053 | 0 |
| `bunx vitest run --shard=4/4 --maxWorkers=2` | 1,954 | 0 |
| **Total** | **7,998** | **0** |

This exactly matches the last reported baseline. Test inventory delta: zero.
No tests deleted, renamed, rewritten or added. Logs: `/tmp/upcoming-rhythm/before-{1,2,3,4}.log`.

## Fresh after-change tests

Each command ran separately, sequentially:

| Command | Passed | Failed |
|---|---:|---:|
| `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,084 | 0 |
| `bunx vitest run --shard=2/4 --maxWorkers=2` | 1,907 | 0 |
| `bunx vitest run --shard=3/4 --maxWorkers=2` | 2,053 | 0 |
| `bunx vitest run --shard=4/4 --maxWorkers=2` | 1,958 | 0 |
| **Total** | **8,002** | **0** |

Full-suite total **7,998 → 8,002**, delta **+4**, all in shard 4.
Focused command: `bunx vitest run src/test/completedWeekFacts.test.tsx src/test/heroBlocks.test.tsx --maxWorkers=2`: **32/32**.
Logs: `/tmp/upcoming-rhythm/after-{1,2,3,4}.log`, `focused.log`.
Latest automatic build log: **build OK**.

### Test inventory and changed assertions

No tests deleted or renamed. Existing tests updated only in `completedWeekFacts.test.tsx`:

- **WWT path**: old `['T9','−6','AFTER R1','3 back']` → `['T9','−6','R1 · 3 BACK']`; equivalent R2/R3 merges, FINAL loses `Won · Playoff`. The brief supersedes separate sub-lines.
- **Abu Dhabi path: Level, Led by and Won by two**: old `['T1','−12','AFTER R2','Level']` → `['T1','−12','R2 · LEVEL']`; R1/R3 merged and FINAL loses `Won by two`.
- **three-round event gives AFTER R1, AFTER R2, FINAL**: old `['AFTER R1','AFTER R2','FINAL']` → `['R1 · 3 BACK','R2 · LEVEL','FINAL']`; case name retained.
- **WWT values and ranks**: old `['E','PAR 3s','T52 in field']` → `['E','PAR 3s · T52']`; equivalent PAR 4s merge, PAR 5s becomes `BEST`.
- **Abu Dhabi ranks**: old `['−2','T5 in field']` → `['−2','PAR 3s · T5']`; equivalent PAR 4s/5s labels.
- **tied at the top reads T1, and null hole types hide the row**: old `.sub === 'T1 in field'` → `.label === 'PAR 5s · T1'`; null assertion unchanged.
- **WWT six cells in order**: old `['63','LOW ROUND','5 players']` → `['63','LOW · 5 PLAYERS']`; BIRDIES/AVG/CUT merge; hardest `['4th','HARDEST','+0.22 · Par 4']` → `['4th +0.22','HARDEST']`, easiest equivalent.
- **Abu Dhabi: no cut becomes FIELD**: old `['70','FIELD','No cut']` → `['70','FIELD · NO CUT']`; LOW/BIRDIES/AVG merge and ordinal/average values share the first line.
- **sub-lines starting with a word start with a capital**: old `c.sub` first-character check → `c.label` first-character check; name retained, capital rule preserved on the replacement single label.

New tests (+4):
- `completedWeekFacts.test.tsx`: **contains no separate sub-line or 11.5px style**.
- Same file: **uses the shared score helper for negative, even and positive top-three values**.
- `heroBlocks.test.tsx`: **shared THE EVENT band uses board TOT figures for both page callers**.
- Same file: **all upcoming seams reference the shared completed tokens**.

## Measurements and screen checks

The router identity problem was resolved in the temporary fixture only, using
Vite's exact resolved imports; no production code was altered for the fixture.

390px, shared production sections with real stylesheets:

| Gap | Overview before → after | Tournament before → after |
|---|---:|---:|
| Fact labels → LAST YEAR | 30 → 16px | 30 → 16px |
| Last LAST YEAR row → THE COURSE | 18 → 16px | 18 → 16px |
| New THE EVENT heading → facts | absent → 9px | absent → 9px |
| Buttons/sentence → THE EVENT text | absent → 18px | absent → 16px |

The first heading matches HOW IT WAS WON on the same-page fixture: overview
18px (16px shared section gap plus existing 2px chip floor), tournament 16px.
THE EVENT was absent before, so no fabricated before heading measurement is given.
Heading measurements use text-range bounds; earlier element bounds included
the heading's own 16px padding and were not text-to-text.

Checked both page wrappers at **320/390/430**, upcoming with and without draw,
and both retained WWT/Abu Dhabi payloads: no value overflow; no label truncation
except permitted **BIRDIES · MCILROY** ellipsis at 320 on both pages. WWT's
`CUT · 75 MADE IT` and all ordinal/average pairs fit at 320. Negative top-three
values read `rgb(226,75,63)`; even/positive read `rgb(248,250,252)`.

Screenshots: `docs/verification/tour-heroes/WWT_no_draw_320.png`,
`ABU_no_draw_320.png`, `upcoming_draw_390.png`; complete width set in that folder.
Measurements: `/tmp/upcoming-rhythm/screens.log`.

These are production-component fixtures, not full authenticated live-page or
device checks. Live overview/tournament payload hydration, real islands/chips
and navigation remain unverified here; no authenticated end-to-end claim.
The fixture's static anchor/chip placeholders are not redesigned app controls.

No SQL, migration, RPC/edge-function, guest, review-wizard, news, round-plot,
feed_config, round_pool_cap or native/Median changes were made.