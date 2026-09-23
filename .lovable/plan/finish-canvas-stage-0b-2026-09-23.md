# Finish Canvas Stage 0B

## Scope
Complete only the three missed surface-colour shapes while preserving every rendered colour value exactly:

1. Route in-scope gradient stops in member-app TypeScript/TSX through `src/lib/tokens/surfaces.ts`, including alpha-derived stops.
2. Replace in-scope stylesheet surface literals in `src/index.css` and `src/styles/*.css` with single-owned CSS custom properties.
3. Route in-scope surface literals embedded in expressions, lookup objects, arguments, defaults, and concatenations through the token module.
4. Re-check every Stage 0 file for missed in-scope surface literals.

## Guardrails
- Leave glass/blur, scrims/backdrops, media letterboxing, media/avatar/cover fallbacks, skeletons/shimmer, charts, maps, admin, and foreground ink unchanged.
- Do not alter any colour value, layout, component behavior, or existing component inventory.
- Keep `src/test/canvasSurfaceToken.test.ts` unchanged.
- Add a separate regression test proving CSS `--background` remains colour-equivalent to `PAGE_CANVAS`, with comments linking both declarations.

## Verification and report
- Run the unchanged canvas token test, the new equivalence test, type checking, and the existing test suite.
- Open every accessible requested member screen and report authenticated screens honestly as unverified when unavailable.
- Report conversion totals, every changed gradient, every new CSS property and declaration location, unresolved surfaces, and deliberate ink exclusions.
