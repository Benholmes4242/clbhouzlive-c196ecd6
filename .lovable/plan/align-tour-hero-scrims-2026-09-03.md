# Align Tour hero scrims

## Scope
- Make the Tour Overview photo hero use the same single, full-frame canonical scrim as Course Detail, terminating on the dark canvas rather than a Tour-specific board surface.
- Make individual Tournament Detail photo heroes use the same canonical background helper, while preserving their existing image focal point, fallback artwork, height, content, and downstream bands.
- Leave course, Discover, news, and other hero consumers unchanged.

## Technical details
- Reuse `heroCanonBackground` from `src/features/tourhub/_shared/heroGradient.ts`; do not add a new gradient recipe.
- Remove the Tour Overview hero's partial-height overlay and compose the canonical scrim across the full photograph.
- Keep all tournament state logic, carousel behavior, typography, and navigation intact.
- Verify TypeScript and inspect the Tour Overview and an accessible tournament detail route at mobile dimensions.
