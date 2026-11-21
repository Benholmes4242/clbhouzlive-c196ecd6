# Tour overview — two narrow-screen fixes

## Changed lines

- `src/features/tourhub/components/overview-v3/HybridHeroBands/liveStates.css:3`: moved `.live-facts .live-fact-short{display:none}` from after the first 340px media block to before it. No other rule in that file changed.
- `src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx:138–144`: moved the existing heading into `[data-recap-table]` as its first child. Added a local ownership comment at line 132. Row order, trophy, dash, tap targets and colours unchanged.
- `src/styles/hybrid-hero.css:92`: points grid is now `30px minmax(0,1fr) auto auto`, gap 12px; existing margin retained.
- `src/styles/hybrid-hero.css:94`: heading uses `display:contents`; kicker still spans columns 1–2; numeric labels retain right alignment.
- `src/styles/hybrid-hero.css:96`: at ≤340px the grid is `26px minmax(0,1fr) auto auto`, gap 8px, BEHIND 13px. PTS remains 15px. Names alone retain ellipsis.

No SQL, migrations, feed_config, data reads/writes or business rules changed. The growing recap photo and Next up footer were untouched.

## Tests by name

Added exactly four cases in **src/test/overviewNarrowFixes.test.tsx**:

1. **places the hidden short-label base rule before the 340px override** — checks CSS source ordering.
2. **keeps both label spans inside the rendered scoring-average cell** — checks the full/short span structure and figure 70.25, not translated words.
3. **shares one intrinsic points grid between the heading cells and three standings rows** — checks heading-first containment, three rows, auto columns, 12/8px gaps, spanning kicker and narrow 13px BEHIND rule.
4. **renders every Champions PTS and BEHIND figure in full without numeric ellipsis** — checks PTS `4,999,830 / 4,357,828 / 2,789,778`, BEHIND `— / 642,002 / 2,210,052`, no numeric ellipsis/clipping rule, PTS 15px and names-only ellipsis.

Existing tests were searched for the separate heading grid and retired fixed widths. None encode those declarations, so **no existing test assertion, case name or file was changed, removed or renamed**. Real MemoryRouter and English translation providers were used; no partial mocks.

Focused command:

`./node_modules/.bin/vitest run src/test/overviewNarrowFixes.test.tsx src/test/seasonRecap.test.tsx src/test/boardHeadersNoPosPlayer.test.tsx`

Result: **42 / 42 tests, 3 files**. Full output retained as `focused.log`.

## Four sequential shards

Each ran as its own command after the previous completed, with complete output retained.

| Command | Passed / executed tests | Files |
|---|---:|---:|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,377 / 2,377 | 215 |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,341 / 2,341 | 215 |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,419 / 2,419 | 215 |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,513 / 2,513 | 213 |
| **Total** | **9,650 / 9,650** | **858** |

Before: **9,646 tests / 857 files**. After: **9,650 tests / 858 files**. Delta: **+4 tests / +1 file**, entirely the four named `overviewNarrowFixes` cases above. Zero failures or reruns.

Shard distribution reconciliation: new file's four tests ran in shard 3, while the unchanged one-case `src/test/invalidateHandicapPrivacyCaches.test.ts` moved from shard 3 to shard 4 under the runner's repartitioning. Thus shard 3 gains three net tests and shard 4 gains one; no additional cases appeared or disappeared.

## 320 captures and browser verification

Requested captures:

- `captures/live-facts-320.png`: **AVG** is visible below 70.25; all four figures stay on one line.
- `captures/champions-points-320.png`: all three PTS figures and both trailing BEHIND figures display fully; labels align over their shared columns and figures no longer touch.

Boundary checks were also captured at 340, 341 and 390 CSS pixels. AVG shows at 320/340; SCORING AVG shows at 341/390. Every final screenshot was visually inspected.

At 320, measured columns are **26px / 113.42px / 57.84px / 66.73px**, gap **8px**. BEHIND is **13px**, PTS **15px**. Every numeric cell's scrollWidth fits its clientWidth; none has computed ellipsis. Both headings' right edges align with their figure columns. No horizontal viewport overflow or browser page errors at any checked width.

The real linked Stewart Cink name was clicked and the existing navigation returned `/tourhub/player/fixture-cink`; the unlinked Steven Alker name remains plain text. Fixtures are isolated actual sections, not authenticated live-data or physical-phone checks. No app-only capture affordance was added. Temporary capture HTML/TSX was deleted.

Latest harness diagnostic: **build OK**, 21:29:53 UTC. Evidence is retained at `.lovable/reports/overview-narrow-fixes/`: report, focused output, four full shard logs, eight screenshots and measurements. The Files archive includes the same evidence.
