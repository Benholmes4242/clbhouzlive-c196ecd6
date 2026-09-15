# Explore hero card collision and legibility

## Goal
Rebuild only the `onPhoto` hero layout in `ExploreCard` so the chip, copy, and trace occupy separate vertical lanes, while standard and pair cards remain unchanged.

## Implementation
- Keep the existing chip at its 8px top offset, but reserve a fixed top lane equal to that offset, the chip's rendered height, and at least 12px clearance.
- Change hero photos from fixed height to `minHeight: PHOTO_H[size]` and lay their foreground content out as one full-height vertical column:
  - reserved chip lane
  - flexible middle lane with kicker, clamped headline, and who-line aligned to its bottom
  - bottom lane of `band + 12px` when a trace exists, otherwise 14px
- Keep the background image absolutely filled with `object-fit: cover`, so additional height remains fully covered.
- Move the darkening treatment behind the copy and continue it through the trace lane. The gradient will be anchored to the copy wrapper rather than guessed from the card's total height.
- For hero cards only, make the kicker and non-viewer name white, raise date/separator text to 85% white, retain the viewer's amber name, and add the requested subtle shadow to kicker, headline, name, and date.
- Pass the actual `onPhoto` state into `WhoLine`; its current `size === 'lead'` check would otherwise leave earned standard-size heroes with standard-card colors. Standard and pair rendering will remain unchanged.

## Verification
- Add stable card markers needed to measure chip bottom and kicker top without changing visible UI.
- Add focused component/style assertions for hero versus standard behavior, including no-trace bottom spacing and viewer amber preservation.
- Capture the requested authenticated examples when available: henryd3737 70, danny.akers1 Addington record, a three-line lead, a no-trace hero, a bright-sky hero, and the viewer's own round.
- At 320px and 390px, measure every rendered hero's chip-to-kicker gap (minimum 12px) and confirm `document.body.scrollWidth === clientWidth`.
- Run focused tests, TypeScript checks, and whitespace validation. If external authentication prevents the named live cards from rendering, report that limitation rather than substituting unrelated cards.

## Existing contradiction
The source comment says only lead cards put text on the photograph and standard cards put text beneath it. That became stale when earned standard-size heroes were introduced. The requested behavior wins; the comment and the `WhoLine` lead-size assumption will be corrected.
