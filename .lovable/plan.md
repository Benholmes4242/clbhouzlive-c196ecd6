# Glass scorecard S3

## Confirmed cause

- `ScorecardGlassOverlay` measures the first mounted frame with `card.offsetHeight`, stores it in `lockedHeight`, and writes that value back to the card's inline `height`.
- On a cold first open, that frame contains the skeleton. When hole data arrives, the resolved scorecard is constrained to the skeleton's pixel height, producing the clipping that disappears on a warm second open.
- The 150ms data-readiness hold is separate and remains useful for smooth entry; it must not be used as the correctness guarantee.

## Implementation

1. **Restore intrinsic card sizing**
   - Remove `lockedHeight`, the first-frame measurement, and the computed `height` style entirely.
   - Keep the card at intrinsic `height: auto`, bounded only by `max-height: 82dvh`.
   - Preserve the fixed honours/summary regions and the existing body contract: `flex: 1`, `min-height: 0`, `overflow-y: auto`.
   - Keep the 150ms unresolved-data hold and opacity/transform-only entry and exit motion unchanged.

2. **Remove the close instruction, not the behaviour**
   - Remove the visible “Tap anywhere to close” footer.
   - Remove its key from all six locale files after confirming it has no other reader.
   - Preserve card-background dismissal, guarded interactive controls, backdrop dismissal, downward swipe, Escape, and horizontal-swipe click suppression.

3. **Restructure the exits row**
   - Keep one guarded outer container.
   - Render comment then heart as a fixed engagement cluster with its existing internal spacing.
   - Render View profile, View course, and Share as one indivisible links group using `flex: 1` and `justify-content: space-evenly`.
   - Shorten the scorecard share label to “Share” in all six locales.
   - At narrow widths, move the complete links group to a full-width second line; never allow individual links to wrap onto separate rows.

## Verification

- Cold-cache first open: confirm the fully resolved card is complete on its first appearance, with no clipped content.
- Warm second-round open: compare card geometry and content with the cold result.
- Verify a deliberately tall late-content state grows to `82dvh` and scrolls only inside the body.
- Capture the exits row at 390px and 320px; confirm equal link spacing and group-only wrapping at 320px.
- Confirm card-background dismissal still works and every guarded action leaves the card open.
- Recheck backdrop, downward swipe, Escape, and horizontal paging dismissal behavior.
- Run focused scorecard tests and TypeScript checks; the project harness performs build validation.
