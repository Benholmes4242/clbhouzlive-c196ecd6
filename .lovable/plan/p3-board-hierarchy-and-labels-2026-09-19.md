# P3 board hierarchy and labels

## Changes
- Remove the duplicate board chip rail and repeated board heading from the Explore board.
- Place the back action and sample meta on one baseline at a 24px gutter.
- Render the existing board column header before all populated rows.
- Move Explore board content type to a 24px gutter while allowing row rules to remain full width.
- Apply the Tour board's existing leader wash to every rank-1 Explore row, preserving amber self identity.
- Pass the Tour score helper's leader emphasis to rank-1 total scores only.

## Verification
- Check 320px and 390px widths across Lowest gross, Lowest net, Stableford, and Most recent.
- Measure chrome above the first row and visible rows per screen.
- Confirm long course names ellipsize without number collisions.
- Confirm tied leaders both receive the wash and a leader/self row keeps amber identity.
- Confirm Tour leader totals turn white while other totals and round scores remain unchanged.

## Technical details
- No query, filter, ranking, URL, persistence, analytics, or SQL changes.
- Keep existing row geometry, pinned-self behavior, gap copy, widening, empty, and filtered states unchanged.
