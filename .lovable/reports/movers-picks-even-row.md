# Tour overview: movers and picks spaced evenly, no tiles, no picks line

Brief: movers and picks spaced evenly across the full width with no tiles, and
the line above "Our tournament picks" gone. Signed-off mock:
`/mnt/user-uploads/movers-picks-even-signed-off.html`.

## The even row

Seven tracks, cards in columns 2, 4 and 6, the four `1fr` spacers sharing the
free space equally and never dropping below 12px:

`minmax(12px,1fr) auto minmax(12px,1fr) auto minmax(12px,1fr) auto minmax(12px,1fr)`

Defined once as `EVEN_ROW_GRID` (with `EVEN_ROW_COLUMNS = [2, 4, 6]`) in
`src/features/tourhub/components/overview-v3/overviewTokens.tsx`, so the real
bands and the loading shells cannot drift.

## Files changed

Source:

- `src/features/tourhub/components/overview-v3/overviewTokens.tsx` — added
  `EVEN_ROW_GRID` and `EVEN_ROW_COLUMNS` with the rule in a header comment.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
  — `RoundMovementBand`: three movers now use the even row with
  `margin: '8px -20px 0'` (the band keeps `padding: '12px 20px 10px'`, so the
  kicker stays put); cards take columns 2/4/6. Two movers (centred pair) and one
  mover (centred) unchanged; card internals unchanged.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx`
  — `[data-overview-picks-hairline]` removed entirely (and the now-unused
  `WHITE_ALPHA_06` import); `[data-overview-picks]` keeps `paddingTop: 8` and the
  heading keeps its 16px top padding. `[data-overview-picks-grid]`: three picks
  use the even row with no side padding; two picks use the centred pair
  (`minmax(0,1fr)` x2, `columnGap: 32`, inside 20px side padding, first card
  `justifySelf: end`, second `start`); one pick is centred.
  `[data-overview-pick-card]` loses the tile — no border, no radius, `padding: 0`,
  `background: transparent` — and keeps the button element, flex row, gap 8,
  height 46, `minWidth: 0`, `textAlign: left`, `active:opacity-70`, the
  `onClick` that opens the pick, the aria-label, the 28px `PlayerAvatar`, the
  surname and every figure/tee/status line.
- `src/features/tourhub/components/overview-v3/overviewShells.tsx` — the picks
  shell's separator div removed; `SmallCards` (both versions) now use the even
  row with no border, no radius and `padding: 0`, the movers version carrying
  `margin: '8px -20px 0'` to match the real band.

Tests:

- `src/test/tourMoversNoTile.test.tsx` — (b) and (g) updated from
  `space-between`/8px gap to the even-row grid (cards in columns 2/4/6,
  `margin: '8px -20px 0px'` as jsdom normalises it); (f) updated so both picks
  and mover shells have no outline, no radius and `padding: 0`; new (h) asserts
  the picks shell has no separator line.
- `src/test/tourOverviewMergedAiry.test.tsx` — the case renamed to
  `adds no picks hairline and keeps the tighter cards in %s`; the hairline is
  now expected absent and the pick card padding is `0px`. The `paddingTop: 8px`,
  heading `16px` and grid `paddingBottom: 0px` checks stay.
- `src/test/tourOverviewPicksChipsFullBoard.test.tsx` — the case renamed to
  `render three across the even row with no tile and no chevron`; the grid is
  expected to use `EVEN_ROW_GRID` with no side padding, cards in columns
  2/4/6, `background: transparent`, `border: ''`, `borderRadius: ''`,
  `padding: '0px'`, `display: flex` and no chevron. Four new cases: (a) the
  three-mover row and the three-pick grid both use the seven-track template with
  cards in columns 2/4/6; (b) two picks use the centred pair and one pick is
  centred; (c) no `[data-overview-picks-hairline]` and no separator in the picks
  shell; (d) a pick card is still a button that opens the pick on tap. The
  `PicksSheet` mock now records its props so the tap case can see `open` and
  `initialPlayerId`; every existing assertion in that file is unchanged.

No test was deleted, renamed away or rewritten outside the three expectation
updates the brief listed (mergedAiry hairline case, chipsFullBoard three-across
case, tourMoversNoTile (b)/(f)/(g)).

## Counts

Command, one shard per run:
`bunx vitest run --shard=N/4 --maxWorkers=2`

| Shard | Tests |
| --- | --- |
| 1/4 | 2,240 |
| 2/4 | 2,105 |
| 3/4 | 2,203 |
| 4/4 | 2,235 |
| **Total** | **8,783** |

Baseline 8,778 + 5 new cases (four in `tourOverviewPicksChipsFullBoard`,
one in `tourMoversNoTile`) = 8,783. Zero failures, zero skips.
Build: `build OK` in `/tmp/observability/build-errors.log`.

## Not verified

The on-screen render at 390 and 320 wide against the signed-off mock was not
re-checked in a browser this turn.
