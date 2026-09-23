# Canvas Stage 0D — Glass token consolidation

## Goal
Route every translucent layer derived from a canonical member-app surface through the same surface token, preserving every RGB value and alpha exactly. Also route Echo’s remaining opaque canvas literal through a single-owned CSS property.

## Implementation
1. Build the exhaustive inventory from every opaque hex export in `src/lib/tokens/surfaces.ts`:
   - convert each token to decimal RGB;
   - scan TypeScript, TSX, and CSS for matching `rgba()`, alpha-HSL, and 8-digit hex forms;
   - classify each match as a tinted surface layer or excluded foreground ink;
   - separately record neutral black/white, `rgba(15,23,42,x)`, and non-matching near-miss triplets.
2. In TypeScript and TSX, replace confirmed tinted layers with `surfaceWithAlpha(TOKEN, alpha)`. Preserve each original alpha, including every stop in multi-stop gradients.
3. In CSS, define each required alpha as a single-owned custom property with a comment naming its source token, then replace matching literals with those properties.
4. Add an Echo canvas CSS property derived from `IMMERSIVE_FEED_CANVAS` and use it for `src/features/echo-chat/echo-chat.css`’s remaining `#05070A` background.
5. Leave unchanged:
   - neutral black/white scrims and hairlines;
   - every `rgba(15,23,42,x)` light-mode ink tint;
   - foreground ink;
   - all near-miss triplets, reporting them instead.

## Verification
- Keep the existing canvas-token assertions unchanged and add only helper coverage for at least three converted real cases, asserting exact prior `rgba(...)` strings.
- Run the focused canvas test, TypeScript check, full test suite, and whitespace/error checks.
- Re-run the channel-triplet audit to confirm no in-scope literal remains.
- Open all reachable signed-out member screens and report redirects or authentication-only screens honestly.

## Report
Provide:
- converted tinted-layer and file counts;
- a complete token → alpha → file:line table;
- every untouched near-miss triplet;
- neutral scrims and `rgba(15,23,42,x)` findings, grouped with reasons;
- exact verification results and signed-out screen coverage.
