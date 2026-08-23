# Honours Gold and Platinum

## Scope
Update only the Honours Board rarity treatment in `src/components/explore-tab-new/courseled/HonoursBoard.tsx`. Preserve the card and rail geometry, typography, lower panel, event ordering, maintenance flag, and every scorecard mark.

## Implementation
- Replace the current dark olive ace wash and neutral albatross head with two 145° three-stop metal gradients:
  - Albatross: near-white platinum → cool silver → deeper steel.
  - Ace: pale gold → saturated scorecard-family gold → deep amber-gold.
- Apply the metal only to the existing fixed 96px feat block. Keep the course and member block on the unchanged dark panel.
- Put every feat-block string on the shared dark ink role: feat eyebrow, year, yardage, `YARDS`, fallback figure, and hole/par line.
- Give the year a quieter but measured ink opacity suitable for both light metals; target `rgba(15,23,42,0.68)` unless contrast measurement requires raising it.
- Replace the obsolete comment that makes gold/neutral mirror scorecard marks with the explicit two-surface rule: scorecards identify score and intentionally give ace/albatross one mark; Honours ranks rarity and intentionally distinguishes platinum from gold.
- Keep chronological rail order untouched. Albatross outranks ace visually, not by reordering the rail.
- Remove the unused scorecard-gold import from this component only if the new ace gradient no longer references it. Do not edit `SC_FILL_GOLD`, `ACE_GOLD`, `RoundShape`, or any scoring component.
- Leave `LeaderHead` dark rather than applying a feat metal to a grouped person, because the brief limits metal to the feat block and a leader may own mixed feats.

## Tests and verification
- Add focused assertions that an albatross feat head receives the platinum gradient, ace heads receive the identical gold gradient, all feat text uses ink, and card dimensions/order remain unchanged.
- Render a deterministic verification rail containing one albatross and two aces, capture a mobile screenshot, and visually check hierarchy, repeated-gold consistency, unchanged lower halves, and no clipping.
- Calculate contrast at every gradient stop for full ink and the reduced-alpha year; report the minimum ratio and the final year alpha.
- Run the focused Honours Board tests.

## Audit findings to report
- `ACE_GROUND` and `NEUTRAL_GROUND` are local to `HonoursBoard.tsx`, but they currently also style `LeaderHead`; that grouped-member use will be removed so metal remains feat-only.
- `ACE_GOLD` is local to `RoundShape.tsx` and deliberately supplies the shared ace/albatross scorecard mark; it will not change.
- The supplied reference file was not available at `/mnt/user-data/outputs/HonoursRarity.jsx` or the mounted upload paths. The written View A specification is sufficiently exact to implement without consulting rejected artefacts.
