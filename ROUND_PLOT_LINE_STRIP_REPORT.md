# Round plot line and hole strip — STOP report

## Result
Not ready for sign-off. Source edits are finished; no test or source correction was made after the unexpected test failures. No pre-existing failures were known against the supplied green baseline.

- Targeted command: `bunx vitest run src/test/roundPlotLineStrip.test.tsx src/test/roundTilePlot.test.tsx src/test/feedEndDot.test.tsx src/test/feedGrossDots.test.tsx src/test/feedRoundUnderParFill.test.tsx src/test/feedRoundNet.test.tsx src/test/roundPlotScale.test.ts --maxWorkers=2`: **48 passed, 20 failed, 68 total across 7 files**.
- `bunx vitest run --maxWorkers=2` exceeded the 600-second environment limit, so it is not a completed suite result.
- Complete full scope via `bunx vitest run --maxWorkers=2 --shard=1/2` and `--shard=2/2`: **2,328 passed / 6 failed / 2,334 total across 243 files**, plus **2,409 passed / 14 failed / 2,423 total across 243 files**.
- Combined: **4,737 passed, 20 failed, 4,757 total across 486 files**.
- Reconciliation: **4,743/485 + 14 new cases / 1 new file = 4,757/486**. No cases removed. Existing cases retained: 6 endpoint, 3 gross, 5 fill, 15 net, 20 roundTilePlot, 5 scale. The roundTilePlot helper tests remain unchanged because feedHoleDots remains exported for test consumers; no production caller imports it.
- Automatic preview validation: latest observed `build OK` at 2026-10-31T08:11:35Z.

## Exact stops
1. All six cases in `src/test/feedEndDot.test.tsx` fail in test setup (width spy declared on line 12). Tool error: `TypeError: 'getBoundingClientRect' called on an object that is not a valid instance of Element.` Stack: `node_modules/jsdom/lib/jsdom/living/generated/Element.js:892:15`. This also blocks its two otherwise unchanged Explore endpoint cases.
2. All fourteen new cases fail at `src/test/roundPlotLineStrip.test.tsx:28:6`: `TypeError: Cannot redefine property: ResizeObserver`. The shared test setup defines the global without configurability; the new test attempts vi.stubGlobal. No change was made after this failure.

## Source diff
- `src/components/feed/roundTilePlot.tsx`: measured width via ResizeObserver; fixed 96px SVG with 16px x-insets and 8..72 line geometry; no aspect-ratio stretching; net series and six-stroke floor unchanged; gross-graded strip; conditional red area/stroke/level rule; neutral r4 card-bordered terminus; complete-18 OUT/IN; 60% observer/120ms delay/1200ms cubic draw, 240 samples, animation cancellation, reduced-motion and missing-geometry fallback; session score-id Set. Gold feat styling unchanged.
- `src/features/explore-magazine/ExploreCard.tsx`: both existing callers pass `scoreId={item.facts.score_id ?? null}`; existing tap handlers unchanged.
- `src/test/feedEndDot.test.tsx`, `src/test/feedGrossDots.test.tsx`, `src/test/feedRoundUnderParFill.test.tsx`, `src/test/feedRoundNet.test.tsx`: authorised old-rule updates below.
- `src/test/roundPlotLineStrip.test.tsx`: fourteen new cases below.
- `roadmap.md`: current task and stop.
- `ROUND_PLOT_LINE_STRIP_REPORT.md`: this report.

## User ruling
The attached mock wins for both disputed animation details: initial reveal width **0**, not 16; draw approaches W−16, then adds 16 on the final frame, rather than continuously interpolating to W.

## Existing test changes (no removal)
### feedEndDot.test.tsx — four Home cases renamed
- “last-hole birdie keeps its tone with no ink overlay” → “last-hole birdie has the neutral end mark and gross birdie strip”: `fill === TOPAR_UNDER_DARK; r === '2.8'` → `fill === '#F2F4F7'; r === '4'`.
- “last-hole par keeps its quiet par dot with no ink overlay” → “last-hole par has the neutral end mark and quiet par strip”: `fill === '#727377'; r === '2.4'` → `fill === '#F2F4F7'; r === '4'`.
- “last-hole double keeps its grade with no ink overlay” → “last-hole double has the neutral end mark and gross double strip”: `fill === SC_DOUBLE_DARK; r === '2.8'` → `fill === '#F2F4F7'; r === '4'`.
- “an unscored final point retains the unchanged ink terminus” → “an unscored final point has the neutral four-pixel terminus”: `fill === A.INK; r === '2.6'` → `fill === '#F2F4F7'; r === '4'`.
All four retain `marks.toHaveLength(1)`; x changes 334 → 324 for measured width 340 and new 16px inset. Gross strip is separately asserted in the new grading case. The two Explore case assertions remain unchanged. Why: the new plot always ends in a neutral terminus rather than a graded hole dot.
### feedGrossDots.test.tsx — two renamed cases
- “renders a gross birdie on a stroke hole in the birdie tone, not gold” → “renders a gross birdie strip cell on a stroke hole in the birdie tone, not gold”: selector `circle` → `[data-plot-hole]`; assertions `fill === TOPAR_UNDER_DARK` and `fill !== SC_FILL_GOLD` unchanged.
- “five gross birdies off three retain five red dots and no allowance-created gold dots” → “five gross birdies off three retain five red cells and no allowance-created gold cells”: `querySelectorAll('circle')` → `querySelectorAll('[data-plot-hole]')`; counts 5 red and 0 gold unchanged.
The sixteen-gross-bogeys helper case is unchanged. Why: gross vocabulary now lives in the strip, not on the net line.
### feedRoundUnderParFill.test.tsx — five cases updated
- “renders an area when the round finishes under par”: `querySelector('clipPath')` → `querySelector('[data-under-clip]')`; local clip reference assertion retained.
- “keeps the area for a round that dipped under and finished over”: unchanged.
- “adds neither fill nor definitions when a round never dipped under” → “adds no under-par fill, gradient or level rule when a round never dipped under”: `defs === null` → `linearGradient === null; [data-plot-level] === null`; `svg > path count === 1` → `[data-plot-trace] count === 1`.
- “keeps a flat level round without an area”: `defs === null` → `linearGradient === null; [data-plot-level] === null`.
- “gives two mixed rounds distinct clip and gradient ids with local references”: `ids length === 4; unique size === 4` → `ids length === 6; unique size === 6`; local under clip selector explicitly `[data-under-clip]`.
Why: every plot now has a reveal clip and the line is nested inside its animated group; under-par resources remain earned only.
### feedRoundNet.test.tsx — one selector update
“a round under its handicap renders the fill; one that never is renders none”: `querySelector('clipPath')` → `querySelector('[data-under-clip]')` for both under/over assertions; not-null/null expectations retained. Why: the reveal clip exists independently of the under-par clip.
### roundTilePlot.test.tsx
No changes, including “feedHoleDots — every played hole, scorecard ramp”. Helper retained; no per-hole dots are rendered. Feat and panel tests remain intact.

## New cases — roundPlotLineStrip.test.tsx (+14)
- draws at observed width without stretching circles
- replaces per-hole dots with one neutral bordered endpoint
- grades one strip cell per hole by gross rather than net
- keeps outer strip edges flush and widens only the eighteen-hole turn
- earns red fill, red stroke and rule only by dipping net under par
- prints net OUT and IN only for complete eighteen-hole cards
- prints E for level nines
- keeps the strip, foot and rule outside the animated group
- never draws before threshold and plays after the 120ms delay
- renders a remounted round finished without replaying
- finishes immediately with reduced motion
- finishes immediately when path geometry is unavailable
- cancels pending animation on unmount
- a plot tap still reaches the card scorecard action during draw

## Preview proof and remaining limits
No member session can be restored: environment reports `external_unmanaged`. Authenticated finished over/under/nine-hole comparisons, mid-draw screenshot and live scroll-back no-replay proof were not performed. No fixture screenshot is offered as a member verification. Test setup failures prevent animation/tap regressions from executing, so neither is claimed verified.

No SQL, migrations, feed_config, deployed RPC/edge, native/Median configuration or round_pool_cap changes. No new negative letter-spacing. No publication.
