# Explore round trace under-par fill

## Goal
Add an opt-in soft red area beneath Explore round traces only where the cumulative gross score is under par, without changing the shared chart's existing consumers or line/dot rendering.

## Implementation
1. Add `underParFill?: boolean` to `RoundShape`, defaulting to false.
2. In the Explore line-only path, derive the fill from the existing smooth trace path, close it along the par baseline, and clip it below that baseline.
3. Use per-instance `useId()` IDs for the clip and vertical gradient. Import the existing on-photo under-par red token, with top/bottom opacity constants declared near the chart constants.
4. Render the fill only when enabled and the cumulative series contains a value below zero, before the baseline, glow, line, dots, and end marker.
5. Enable the prop at both `ExploreCard` call sites only. Leave FriendsPlayedRail and AmateurHero unchanged.
6. Add focused tests for absent/present fill states, return-to-par and under-par finishes, opt-out behavior, partial data, and unique SVG IDs across two instances.

## Verification
Run focused tests, the project TypeScript check, and the production build. Report the unchanged consumers and device checks for gradient strength, crossing edges, and photo legibility.
