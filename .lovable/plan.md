# Tour Overview H9 — hero foot

## Scope and precedence

- Preserve H6: tied-leader text stays on one line in a content-sized right column capped at 150px.
- Preserve H8: overview board rows have no rules; only the hairlines above OUR PICKS and the two-door actions row remain.
- H9 supersedes H2’s 360px overview-only hero height and C14’s multi-column facts treatment.
- Keep shared `PHOTO_BAND_HEIGHT=340` and `OVERVIEW_HERO_HEIGHT=340px` unchanged.

## Implementation

1. **Fix the lifecycle gate at its source**
   - Fetch and render tee time, defending champion, prior winning score, and field strength only when `phase === 'upcoming'`.
   - Live and completed phases will never build or render the facts line; no CSS hiding or compensating spacing.

2. **Close the photograph/content seam**
   - Measure the current rendered distance from the photograph bottom to the first visible board/facts text.
   - Increase `OVERVIEW_PHOTO_BAND_HEIGHT` by that measured whole-pixel distance and remove the same vertical inset from the board header/upcoming facts owner, so photograph and content are adjacent without moving the content upward on screen.
   - Update `OVERVIEW_HERO_TOTAL_HEIGHT`, the loading skeleton, comments, and focused height assertions from the resulting measurement (expected 386px).

3. **Use one shared glass recipe**
   - Extract/export the existing dark Chrome Island glass material from its current owner rather than copying values.
   - Apply that exact fill, 16px blur, and hairline to the LIVE/STARTS/FINAL badge and countdown boxes.
   - Preserve each element’s existing shape, dimensions, copy, and H6 layout.

4. **Replace columns with a flowing facts sentence**
   - Build only populated upcoming fact pairs in this order: FIRST TEE, DEFENDING, FIELD.
   - Render one left-aligned, wrapping flex line at the 24px gutter with 13px vertical padding.
   - Labels use 9.5px/800 tracked muted type; values use 14px/700 white, except the prior under-par winning score remains red.
   - Attach each middle-dot separator to the preceding pair. Missing facts close up; no facts means no line.

## Verification

- Add focused tests for the upcoming-only facts gate, one/two/three-fact composition, lifecycle doors, and overview/shared height separation.
- At 390px, capture: live flush to POS, completed flush to board header, Walmart-style one-fact line, PURE-style two-fact line, three-fact wrapping, and badge beside the tour chip.
- At 320px, verify the three-fact line wraps without horizontal overflow.
- Measure and report the final hero height, photograph-to-content gap, actions-row bottom edge, nav top, and remaining headroom at 390×844.
- Confirm five player rows remain 44px, H8 hairline count remains exactly two where picks exist, row taps still open the scorecard, and one/two-door states remain intact.
- Run focused tests, TypeScript checks, production build, and diff validation.
