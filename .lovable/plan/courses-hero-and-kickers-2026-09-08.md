# Courses hero and kickers

## Build
- Make the shared Courses hero a fixed 340px, edge-to-edge frame with a straight bottom edge. Keep the existing image, course title, location, best-round fact, and View Course action unchanged.
- Keep the shared chrome islands as the only safe-area owner; remove the hero's duplicate safe-area payment.
- Move the hero's existing list/location/round kicker into the bottom content stack and apply the canonical 9px / 700 / 0.19em Explore kicker treatment at 66% white.
- On the Courses tab, replace “Where this community plays” plus the repeated board title with one dynamic kicker: the active sort name followed by “Courses”. Keep the existing description and real tracked-course sentence beneath it.
- Make the Top 100 description use the same supporting-text treatment as Courses. Courses is the reference because its 14px body copy is the established readable board description.

## Verification
- Check Courses and Top 100 at mobile width for a 340px hero, full bleed, hard lower edge, unobscured kicker, and identical description typography.
- Switch every Courses sort and confirm the kicker follows the active board.
- Report any other slogan-style kickers found by the audit; do not alter unrelated surfaces in this change unless they are the same shared component.

## Technical details
- Reuse the canonical type kicker token and existing dark canvas/scrim tokens rather than adding new values.
- Preserve all queries, sorting, analytics, cards, filters, routes, and safe-area chrome behavior.