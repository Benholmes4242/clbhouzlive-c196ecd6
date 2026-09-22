# Nine completeness in the round hole strip

## Scope

- Change only `RoundCardHoleStrip` and its focused regression coverage.
- Keep every hole cell, score mark, total, and complete-nine visual unchanged.
- Do not touch the scorecard head, shape data, preview data, Explore, feed scoring, database functions, SQL, migrations, or requeues.

## Implementation

1. In each OUT/IN row, establish completeness first: exactly nine holes, with every hole satisfying `played === true` and `par != null`.
2. Compute and render the nine's par-derived delta only for a complete nine.
3. For an incomplete nine, retain the existing gross total and hole marks, but render no par-derived delta.
4. Add focused cases for:
   - ten-of-eighteen: OUT unchanged, IN has no delta;
   - complete eighteen: both nines unchanged;
   - complete nine-hole round: OUT unchanged.

## Verification

- Run the focused hole-strip tests and TypeScript check.
- Run the full configured suite and confirm 704 passing with the same four unrelated failures.
- Report the par source for the seven named unchanged to-par sites and explicitly state whether any locally sums par.
