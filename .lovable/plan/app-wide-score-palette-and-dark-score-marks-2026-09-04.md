# App-wide score palette and dark score marks

## Goal
Restore the golf scoring convention across dark surfaces without changing the light palette: deeper shared under-par red, blue over-par text, distinct dark chip fills, conventional score marks, and slate-to-deep-red course difficulty ramps.

## Implementation

### 1. Repoint the shared score tokens
- Change `TOPAR_UNDER_DARK` to `#E24B3F` in the Tour Hub token authority and update its contrast/ownership comment.
- Keep `TOPAR_UNDER_LIGHT` and the board law for over/even figures unchanged.
- In the hole score token authority:
  - restore dark bogey/double text to `#A6C2F0` / `#7AA6EC`;
  - add `SC_TRIPLE_DARK = #5E8FD9`;
  - add dark fill tokens for birdie, bogey outline, double, and triple;
  - retain `SC_FILL_GOLD = #FFD200` and document canvas-coloured numerals on gold.
- Rewrite the obsolete neutral-ramp commentary so it describes two separate ramps: readable text colours versus chip fills.

### 2. Rebuild the dark score-mark grammar at the shared renderer
- Update `ScoreMark` classification so an ace inherits its actual par-relative band rather than becoming a bespoke variant.
- On dark surfaces render:
  - birdie: red filled circle;
  - eagle: gold filled circle with one separated gold ring;
  - albatross-or-better: gold filled circle with two separated gold rings;
  - par: plain numeral;
  - bogey: unfilled square with the prescribed light outline;
  - double: blue filled square;
  - triple-or-worse: deep-blue filled square with one separated ring.
- Use canvas ink inside gold, and light ink inside red/blue marks. Build concentric marks from surface-coloured gaps plus 1.5px score-coloured strokes without changing the tile’s stable footprint.
- Preserve the existing light renderer byte-for-byte in visual semantics so the light theme remains unchanged.
- Keep `beadForScore` as a trajectory-only rarity signal, but correct its ace logic so an ace follows its par-relative band: par-3 ace receives the eagle bead treatment, par-4 ace the albatross treatment, and no bespoke ace rule remains.

### 3. Align duplicate compact/SVG score-mark renderers
- Update the compact Discover scorecard renderer and `HoleGlyph` to consume the new shared fill/text tokens instead of their hardcoded white-alpha grounds and old red fills.
- Preserve their existing dimensions and layouts while matching the same dark grammar, including triple classification where stroke/par data exists.
- Where a glyph API only exposes a combined category and cannot infer degree, retain the closest declared category and report that limitation rather than inventing score data.

### 4. Restore blue to analytical score distributions
- Repoint `RAMP_TOPAR` over-par buckets to the dark blue text ramp and add a triple bucket only where the underlying data exposes triple separately.
- Keep Tour leaderboard/board over-par figures neutral as specified; blue applies to hole/scorecard scoring buckets, not round-level board verdicts.
- Verify the named SC-token consumers inherit the token changes without cosmetic restyling.

### 5. Deepen the course difficulty ramp
- Replace the current near-white-to-bright-red `DIFFICULTY_RAMP` with a six-stop slate-to-`#C8372B` stepped ramp over each course’s own easiest-to-hardest range.
- Change analytical chart tracks from 10% to 8% white where they are part of the shared difficulty-chart system.
- Keep member overlays amber and under-par figures on the canonical `#E24B3F`; difficulty red remains a separate fill-only ramp.
- Verify the course page shape chart, Discover course panel, “How each par plays,” and other `difficultyRampColor` consumers inherit the shared change.

## Validation
- Add focused renderer tests covering dark birdie, eagle, albatross, par, bogey, double, triple+, and par-3/par-4 ace inheritance, plus unchanged light behavior.
- Run the relevant scorecard/course analytical tests and TypeScript validation.
- Visually inspect dark scorecards and difficulty charts in desktop and mobile-sized preview states where reachable.
- Recalculate contrast against `#15171F`; fail/report any score text below 4.5:1. Expected supplied ratios: red 4.52, bogey blue 9.88, double blue 7.23, triple blue 5.46.

## Final audit report
Report:
1. every hardcoded scoring hex that can bypass the shared palette, including whether it was intentionally left or migrated to an import;
2. any use of a deep chip fill as text;
3. the current `RAMP_TOPAR` definition and treatment;
4. all edited consumer files and why shared inheritance alone was insufficient;
5. whether `SC_TRIPLE_DARK` has direct consumers and every place triple is still folded into double;
6. brief inconsistencies: the prose says three marks for triple while the explicit S3.1 recipe gives triple one outer ring and albatross two; the implementation follows the explicit recipe. The new geometry is applied to dark marks only because the brief also requires the light theme to remain visually unchanged.
