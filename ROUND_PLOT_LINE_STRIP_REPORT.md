# Round plot line and hole strip — test setup complete

## Final authorised setup correction — 31 October 2026

**Targeted 68/68 across 7 files; full suite 4,783/4,783 across 487 files. Zero failures.**

Only the approved fake-timer setup line in `src/test/roundPlotLineStrip.test.tsx` changed:
```ts
// Old
vi.useFakeTimers();
// New
vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
```
This preserves the file's requestAnimationFrame/cancelAnimationFrame mocks and performance.now spy. Direct animation-frame assignment was not needed: the existing stubs work once fake timers stop replacing them. No assertion, expected value, app file, test name or case changed. `src/test/be1BusinessEditSettings.test.tsx`, `src/test/feedEndDot.test.tsx` and `src/test/setup.ts` were untouched.

### Commands and reconciliation
- `bunx vitest run src/test/roundPlotLineStrip.test.tsx src/test/roundTilePlot.test.tsx src/test/feedEndDot.test.tsx src/test/feedGrossDots.test.tsx src/test/feedRoundUnderParFill.test.tsx src/test/feedRoundNet.test.tsx src/test/roundPlotScale.test.ts --maxWorkers=2`: **68/68 across 7 files**.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,360/2,360 across 244 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,423/2,423 across 243 files**.
- Combined complete scope: **4,783/4,783 across 487 files**, no failures or remaining pre-existing failures.
- Before/after this correction: **4,783 tests / 487 files**, unchanged; previous run was **4,779 passed / 4 failed**. Against the requested **4,782 / 487** baseline, the intervening **+1** is BE1.1's “inherits the app font without a font-family declaration in business-edit.css” in `src/test/be1BusinessEditSettings.test.tsx`. This brief added/removed/renamed/rewrote **zero tests**.
- BE1 status only: **26/26 passed**, including the unchanged verified-title assertion and separate font test; no BE1 file edited here.

The four pre-existing animation setup failures (“never draws before threshold and plays after the 120ms delay”, “renders a remounted round finished without replaying”, “finishes immediately with reduced motion”, “cancels pending animation on unmount”) all pass now. Their previous exact errors remain documented below. The animation/no-replay/tap regressions now execute successfully; authenticated member-preview proof remains unavailable as previously reported.

Changed files in this final correction: `src/test/roundPlotLineStrip.test.tsx`, `ROUND_PLOT_LINE_STRIP_REPORT.md`, `roadmap.md`. Latest automatic preview validation: **build OK**, `2026-10-31T09:08:11Z`. No SQL, migrations, deployed RPC/edge changes, protected configuration edits, new negative tracking or publication.

## Historical setup stops

## Approved setup-only rerun — 31 October 2026

**Stopped: 64/68 targeted tests pass; full suite 4,777 passed, 5 failed, 4,782 total across 487 files.** No further test correction was made after the new errors surfaced. No application code, assertions, expected values, test names or test inventory changed in this correction.

### Changed files and quoted setup changes
- `src/test/feedEndDot.test.tsx`: replaced the inherited-method spy with the authorised own-property override in `beforeEach`:
  ```ts
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', { configurable: true, value: () => ({ width: 340, height: 0, top: 0, left: 0, right: 340, bottom: 0, x: 0, y: 0, toJSON() {} }) });
  ```
  `afterEach` now includes `Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect');`, restoring the inherited Element method. All six endpoint cases pass.
- `src/test/roundPlotLineStrip.test.tsx`: the same rectangle override uses width/right **390** and the same `Reflect.deleteProperty` cleanup. Replaced observer `vi.stubGlobal` calls with direct assignment, saving/restoring both original constructors; shared setup also defines IntersectionObserver without configurability:
  ```ts
  originalResizeObserver = window.ResizeObserver;
  originalIntersectionObserver = window.IntersectionObserver;
  window.ResizeObserver = class { constructor(cb: typeof resize) { resize = cb; } observe() {} disconnect() {} } as unknown as typeof window.ResizeObserver;
  window.IntersectionObserver = class { constructor(cb: typeof intersection) { intersection = cb; } observe() {} disconnect() {} } as unknown as typeof window.IntersectionObserver;
  // afterEach, after cleanup():
  window.ResizeObserver = originalResizeObserver;
  window.IntersectionObserver = originalIntersectionObserver;
  ```
  `src/test/setup.ts` is unchanged. The observer redefinition and invalid Element receiver errors no longer occur.
- `ROUND_PLOT_LINE_STRIP_REPORT.md`: added this rerun entry; historical implementation report retained below. No other files changed by this correction.

### Commands and counts
- `bunx vitest run src/test/roundPlotLineStrip.test.tsx src/test/roundTilePlot.test.tsx src/test/feedEndDot.test.tsx src/test/feedGrossDots.test.tsx src/test/feedRoundUnderParFill.test.tsx src/test/feedRoundNet.test.tsx src/test/roundPlotScale.test.ts --maxWorkers=2`: **64 passed / 4 failed / 68 total across 7 files**.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,358 passed / 1 failed / 2,359 total across 244 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,419 passed / 4 failed / 2,423 total across 243 files**.
- Combined full scope: **4,777 passed / 5 failed / 4,782 total across 487 files**.
- Inventory before and after this setup-only edit: **4,782 tests / 487 files**, unchanged. Against the requested **4,757 / 486** baseline, the intervening **+25 tests / +1 file** are the existing `src/test/be1BusinessEditSettings.test.tsx` from BE1. This correction added, removed, renamed or rewrote **zero cases** and changed **zero assertions**.

### Newly exposed failures — no follow-up edits
All four are in `src/test/roundPlotLineStrip.test.tsx`:
1. “never draws before threshold and plays after the 120ms delay”, **107:103**: `TypeError: [Function requestAnimationFrame] is not a spy or a call to a spy!`
2. “renders a remounted round finished without replaying”, **24:59**, called from **114:88**: `TypeError: raf is not a function`
3. “finishes immediately with reduced motion”, **119:131**: `TypeError: [Function requestAnimationFrame] is not a spy or a call to a spy!`
4. “cancels pending animation on unmount”, **125:144**: `TypeError: [Function requestAnimationFrame] is not a spy or a call to a spy!`

The original 20 setup failures were pre-existing on entry; their exact errors have cleared, revealing these four previously blocked failures. One unrelated pre-existing BE1 failure remains unchanged: `src/test/be1BusinessEditSettings.test.tsx:86:43`, “renders verification state verified with its correct action”: `TestingLibraryElementError: Unable to find an accessible element with the role "heading" and name "Verified"`. The accessible heading is `Verified Verified`. BE1 is outside this approval and was not touched.

Latest available automatic preview check: **build OK**, `2026-10-31T08:43:37Z`. No app/visual change or browser verification was requested or made. All protected SQL, migration, configuration and deployment restrictions remain intact. Not all passing; not ready to sign off.

## Historical implementation result

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
