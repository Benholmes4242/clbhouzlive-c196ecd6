# S7: Every Feat on the Card

## Scope
Update the existing scorecard top band only. It will derive one permanent round feat from the scorecard's own hole rows, render on member cards only, and never include course record, net record, or rank-up standings.

## Implementation
- Move feat selection into `CardScorecardSheet`, using the same `holes` rows that draw the grid; remove the host-computed `feat` prop and its wrapper derivation.
- Add a plain five-value feat model and one deterministic selector with this precedence: ace, albatross, eagle, five-or-more birdies, clean card.
- Match exact hole facts: `strokes === 1`, `strokes === par - 3`, `strokes === par - 2`, and birdies at `strokes === par - 1`. A clean card requires every expected hole to be played, including all 9 for a nine-hole round or all 18 otherwise; zero scored holes never produce a band.
- Preserve the existing top-edge position, but replace the metal with a transparent 37px flat band: 1px lower hairline, 9px × 16px spacing, 7px baseline-aligned gaps, amber uppercase label, and muted supporting copy.
- Use the specified emoji marks at 14px. Draw the birdie count at 14px in the existing amber token rather than using an emoji or introducing another colour.
- Name a hole only when exactly one matching ace, albatross, or eagle exists. Use localized copies for the five labels and supporting lines across all six locale files.
- Gate the band to `surface="member"`; tour cards remain unchanged. Record in code that tour ace/albatross support is deliberately deferred.
- Audit the retired metal module. Current search shows its values are read only by the card and its type only by the member wrapper, so remove those imports and delete the now-unused file, with the retirement history preserved beside the replacement feat model.

## Verification
- Add focused tests for all five facts, exact precedence, exact-vs-broader score matching, single-hole naming, multiple-eagle omission, zero-score suppression, partial clean suppression, complete 9/18-hole clean cards, and tour suppression.
- Assert the flat band styling and the unchanged grid mark for the selected eagle fixture.
- Measure member cards with and without the 37px band at the supplied 430×786 viewport and compare both against the existing 82dvh ceiling; confirm no nested card scroll is introduced by the band.
- Run the focused scorecard tests and report callers, final measurements, and any runtime/auth limits. No database or RPC changes.
