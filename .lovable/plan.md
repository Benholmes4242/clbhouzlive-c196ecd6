# Restore VS HCP and update public rarity copy

## Changes
- Restore the signed-off three-column row: PAR, NET, VS HCP, using the existing order, widths, labels, number formatting, and colour treatment.
- Keep the achievement lane, row heights, full-width rarity row, hairline, radius, artwork, tier fills, and owner/public replacement behavior unchanged.
- Make public rarity copy use the frozen distinct-member position for counts 1–3, matching the owner's member phrasing without congratulations.
- Keep the existing ordinal-feat-in-rounds sentence as the public fallback only when the frozen distinct-member count is 4 or higher.
- Add the public member-position strings to all six locale files, preserving lowercase `clbhouz` and each locale's grammar.

## Validation
- Extend focused tests for the restored three-stat layout and the 1/2/3 versus 4+ public-copy branches.
- Measure all four public forms in English and German at the full-width 393px rarity row; stop if any exceeds two lines.
- Capture four 393px states: Lennon non-owner, Lennon owner, German repeat with congratulations, and an INK feat with no second row.
- Run focused tests and verify the rendered pill at 393px.

## Boundaries
- No SQL, migrations, RPC, data-layer, artwork, tint, radius, or row-one height changes.
