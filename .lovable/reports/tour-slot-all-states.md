# Clubhouse Tour slot — all states

## Files changed

- `src/features/clubhouse-tour/TourSlot.tsx`: single-leader portrait above score/surname, result sentence, live round spine, shared movers and new boards. Header, 162px photo/fade, title/venue, engagement and comment controls preserved.
- `src/features/clubhouse-tour/SlotBoard.tsx`: inert five-row live board, result/prior-year top-three reduction, canonical prior-year hook and stroke-only request. Shares tracks, position/total type and round-score calculation with HeroBoardRows.
- `src/features/clubhouse-tour/tourSlot.css`: scoped 34px square, 30%-radius photo leader exception. 1.5px WHITE_ALPHA_18 ring and dark initials fallback; shared avatar defaults unchanged.
- `src/features/clubhouse-tour/tourSlotRules.ts`: pure resultSentence and slotTopThree. Equal regulation scores with a single position-one winner indicate a play-off; insufficient winner/runner evidence suppresses the sentence.
- `src/features/clubhouse-tour/useTourSlotData.ts`: adds photo_url to existing player select; no new write or sync.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/RoundSpine.tsx`: extracted nodes with the overview's original default margin and presentation.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx`: imports extracted spine; overview output unchanged.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`: exported roundMovementCards, existing inPlay guard preserved; optional movement-band gutter/padding retain original defaults.
- `src/features/tourhub/tournament-v2/sections/HeroBoardRows.tsx`: exports existing HERO_ROUND_W, value unchanged.
- `public/locales/en/tourhub.json`: slot result, board and collapsed-group keys.
- `src/test/tourSlotStates.test.tsx`: 13 new cases.
- `src/test/tourSlot.test.tsx`: two authorised old-board expectation/selector updates below; remains 38 tests.
- `roadmap.md` and this report.

Module-local ownership is documented in the new component/helper headers, rather than expanding the near-limit cross-cutting AGENTS.md.

## Existing test updates (no deletions)

`tourSlot.test.tsx`:

1. Renamed `renders board rows 26px high in live and result` to `renders board rows with the shared 31px minimum in live and result`.
   Old assertion: `expect(row.style.height).toBe('26px')`.
   New assertion: `expect(row.style.minHeight).toBe('31px')`; row selector becomes `[data-slot-board-row]`.
   Why: the brief explicitly replaces the old slot board with shared 31px-minimum rows, including result. The three-row fixture assertion stays.
2. `shows the first top tie marker only`: old selector `[data-tour-slot-board] > div > span:first-child` becomes `[data-slot-position]`.
   Assertion retained exactly: `expect([...positions].map(p=>p.textContent)).toEqual(['T1','','3'])`.
   Why: the replacement board has a header, which must not be counted as a player position.

No other existing tests changed, including every Tour overview test.

## New cases and inventory

All 13 additions are in `tourSlotStates.test.tsx`:

- (a) upcoming keeps facts and reads prior-year top three, omitting a null board
- upcoming does not request history for a team event
- (b) keeps four rows for 1, 2, T3 twice
- (b) folds T3 four times into the first name and three others
- (c) day one has no movers and only R1
- (d) round four has dots, movers and five rows with R1–R4
- (e) result has no dots or round columns and uses final-round movers and top three
- (f) result sentence names a five-shot margin and second place
- (f) result sentence names a play-off at equal regulation scores
- (f) result sentence counts a tie for second
- (f) result sentence handles level par
- (f) result sentence handles over par
- (g) single leader has a portrait block and a tie has none

Baseline **8,783** from movers-picks-even-row; +13 new cases = **8,796**. Existing test counts unchanged; no deleted cases.

Focused command:
`bunx vitest run src/test/tourSlot.test.tsx src/test/tourSlotVisit.test.tsx src/test/tourSlotStates.test.tsx src/test/tourMoversNoTile.test.tsx --maxWorkers=2`

Focused result: **65/65**.

Full-suite command, four separate sequential executions:
`bunx vitest run --shard=N/4 --maxWorkers=2`

| Shard | Executed / passed |
| --- | --- |
| 1 | 2,243 / 2,243 |
| 2 | 2,118 / 2,118 |
| 3 | 2,211 / 2,211 |
| 4 | 2,224 / 2,224 |
| Total | **8,796 / 8,796** |

769 test files, zero failures or skips. Build harness latest signal: `build OK` at `2026-11-15T16:10:13Z`. `git diff --check` passed. No manual build/typecheck run.

## Scope and verification limits

No SQL, migrations, feed_config, sync invocation or round_pool_cap changes. No invented/mock player data seeded into the app.

The mock uses a 20px title at 320 and “Final round” in its live round-four photo kicker; the brief freezes the existing title/kicker, so the existing 22px title and round-number kicker remain. The shared overview spine is reused unchanged as requested rather than adopting the mock's different inactive-dot material.

State behavior and feed tap isolation passed tests, but real-member live data rendering, image downloads/fallback sequence, engagement write/readback and on-screen 390/320 comparison were not exercised this turn; visual matching/overflow remains unverified.