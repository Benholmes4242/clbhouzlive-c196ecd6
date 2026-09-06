# Scores section head redesign

## Build
- Replace the sticky panel-style filter with a non-sticky canvas rail 14px below the fixed header: individual applied-filter chips plus a right-side Edit action opening the existing filter sheet.
- Rebuild both Members and Courses with the same eyebrow/headline structure: category plus count in the eyebrow, selected board label as the uppercase headline.
- Keep the existing board rails and data behavior, but apply the specified selected/unselected chip geometry and styling.
- Remove the member and course column-header rows without changing any result-row fields or figures.
- Set the Courses eyebrow 30px after the final member row and preserve all existing empty states, see-all actions, and course analytics.

## Verification
- Check at 320px that “Most improved” and “Lowest round” fit without clipping or overflow.
- Confirm a board-chip tap updates the headline and the filter rail scrolls away with page content.
- Review every board for figures that become genuinely ambiguous without column labels and report any exceptions.
- Check the current preview runtime error while validating, without changing unrelated behavior.
