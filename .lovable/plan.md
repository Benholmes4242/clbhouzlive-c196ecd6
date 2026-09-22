# Completed tournament board state fixes

## Goal
Make completed tournaments visually final while preserving all live-round behavior.

## Changes
- Export one shared finished-status helper from the cut display utility and reuse it for board completion state.
- Extend the full leaderboard column calculation with an optional completion flag so completed rounds never receive the amber live-round header.
- Pass completion state from the Full Board sheet and Leaderboards tab.
- Keep the final mini board’s `R4` label but remove its amber color.
- Change the completed “Round of the day” figure caption from `TODAY` to its round label, while live events keep `TODAY`.
- Render the Full Board leader’s under-par total with the same red score treatment as every other under-par total; retain the leader row wash and brighter name.
- Add focused regression coverage for completed round labeling and lifecycle color behavior.

## Verification
- Run the tournament contest and Tour Overview focused tests.
- Run the TypeScript check and full test suite, comparing failures with the existing baseline.
- Inspect the completed Biltmore tournament page and Full Board at the narrow preview width.

## Report-only findings
- List the three existing duplicated finished-status checks without changing them.
- Note the unused `scoreColour()` helper and its retained leader-emphasis call without removing it.
