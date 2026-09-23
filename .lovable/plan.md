# Finish Canvas Stage 0C

## Scope
Complete the remaining member-app surface consolidation without changing rendered colour values.

## Changes
- Add a new semantic `#0F172A` export in `src/lib/tokens/surfaces.ts` for dark filled controls/cards, distinct from route and suspension canvases.
- Replace the remaining in-scope `#0F172A` and `#0A0A0A` component backgrounds with the appropriate semantic surface exports.
- Replace remaining in-scope gradient surface stops with token references; derive transparent variants with `surfaceWithAlpha` where applicable.
- Route the remaining in-scope stylesheet surface literal through one existing or newly single-owned CSS custom property.
- Leave foreground ink and all excluded glass, scrim, media, fallback, skeleton, chart, map, admin, status, and decorative artwork uses unchanged.
- Leave `--background: 225 11% 10%` and its Stage 0B mismatch comment exactly unchanged.

## Technical details
- Preserve role-specific duplicate exports when identical values serve different semantic purposes.
- Keep `src/test/canvasSurfaceToken.test.ts` byte-identical.
- Re-run a case-insensitive audit after edits and report the seven lowercase-only matches, all remaining exclusions, and the semantic judgement for existing `#0F172A` exports.

## Verification
- Run the unchanged canvas surface test, TypeScript check, and full test suite.
- Re-open public member screens available signed out and state which authenticated screens remain unavailable with external Supabase.
- Report the three pre-existing suite failures by test file and failed assertion without fixing them.
