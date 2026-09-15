# Scores-only circle and unlabelled par baseline

## What will change
- Remove the fixed “Your circle” rail from All; keep the same rail fixed at the top of Scores.
- Keep “Where you stand” in the Scores rotation after the county-course shelf, so it cannot immediately follow the circle rail.
- Remove the centre PAR word from the Explore round-shape footer while retaining the dashed level-par reference line.
- Keep the existing hole-end labels and plot dimensions unchanged unless removing the centre word exposes an avoidable reservation.
- Retire the now-unused Explore baseline-label translation key in all six course locales.

## Scope checks
- Feed round cards and the scorecard sheet use the shared unlabelled trajectory renderer already; preserve their dashed baseline without adding or removing geometry.
- Circle tiles do not currently render a labelled round shape; leave their visual behavior unchanged.
- Preserve all shelf data sources, rotation positions, navigation, analytics, loading behavior, and legacy files.

## Verification
- Confirm All contains no circle shelf call and Scores begins with the circle shelf.
- Confirm the Scores shelf sequence remains county courses, standing, club week, then people.
- Search every live round-shape path for a remaining visible baseline word while confirming dashed baseline lines remain.
- Validate all six locale files, run focused checks, and inspect the mobile page for horizontal overflow where public data permits.
