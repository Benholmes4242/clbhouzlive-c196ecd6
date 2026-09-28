# Match the profile handicap chart to the bottom sheet

## Outcome
Use the same `HcpTrendChart` presentation in the profile Handicap tab, while preserving the tab’s existing history windows, headline, scrub behavior, and no-history state.

## Changes
- Replace the profile tab’s hand-drawn index SVG with the shared chart already used by the profile bottom sheet.
- Pass the profile tab’s existing windowed points, active point, and scrub state into the shared chart.
- Match the bottom-sheet plot height and visual treatment; retain the profile tab’s 30D / 90D / 12M controls and date axis.
- Remove chart-only drawing code that becomes unused, without changing data reads or handicap calculations.
- Update the focused chart tests to assert shared-chart behavior and retained window rules.

## Verification
- Run the focused handicap chart tests.
- Check TypeScript and the latest preview build result.
- Verify the signed-in profile Handicap tab visually if the available session permits it; otherwise report the authentication limitation.
