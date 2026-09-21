# Feat pill rarity row

## Build
- Keep the existing artwork, label, PAR/NET columns, tile tint, radius, and data source unchanged.
- Move the single selected rarity sentence into a full-width second grid row only when a GOLD or TOP rarity line exists.
- Separate the second row with the existing analytical hairline token at the same 0.5px rule weight used between stat columns, aligned to the pill content edge.
- Keep INK pills as a single row with no added divider or reserved space.

## Copy
- Rewrite first-, second-, and third-member owner branches to state the exact frozen position and lowercase `clbhouz` scope in all six locales.
- Preserve repeat, personal-first, public-viewer, branch precedence, owner-data privacy, and safe-name fallback behavior.
- Keep congratulations inside locale interpolation strings and set owner prose to weight 600.

## Verification
- Update focused rarity tests and add pill-structure checks for one selected owner/viewer line and no INK second row.
- Measure every requested English and German branch at the actual full-width row; stop if any exceeds two lines.
- Capture four 393px views: Lennon owner, Lennon non-owner, German repeat with congratulations, and an INK feat without row two.
