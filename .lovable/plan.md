# Tour Overview full-bleed pass

## Scope and supersession

- Apply H1-H5 to the Tour Overview only.
- This deliberately supersedes C11 and earlier raised-card language. Preserve C12's outcome: picks copy begins on the 24px type line.
- Keep `PHOTO_BAND_HEIGHT` at 340 and leave `OVERVIEW_HERO_HEIGHT` and the separate news hero dimensions unchanged.
- Preserve all current data gates, carousel behavior, navigation, analytics, sheets, and the `VenueRecordBand` query.

## Implementation

1. **Full-bleed hero**
   - Change only `OVERVIEW_PHOTO_BAND_HEIGHT` from 300 to 360; let `OVERVIEW_HERO_TOTAL_HEIGHT` follow it.
   - Make the overview photo span edge to edge with square corners.
   - Keep the existing lower-third state, countdown, champion, and tap behavior stable.
   - Strengthen or retain the canonical top legibility treatment only as needed after checking bright imagery and the no-photo `COURSE_GRADIENT` fallback.

2. **Flat board stack**
   - Remove the board wrapper margin, radius, raised `SURFACE`, and clipping.
   - Render board headers and rows directly on `PAGE_CANVAS`, with all text aligned to 24px and row hairlines running screen edge to edge.
   - Flatten the three-up facts when present using the same 24px type line and full-width separators.
   - Replace the picks pill with a 44px full-width row: amber `OUR PICKS`, summary, and chevron.
   - Replace the outlined CTA with a 44px full-width terminal row using the existing flat terminal-row grammar and a right chevron.
   - Keep the expandable picks panel flat on the canvas with full-width separators.

3. **Flatten every remaining overview section**
   - Venue: remove outer margin, radius, and raised fill; keep its content on the 24px line with full-width hairlines.
   - Also This Week: remove card wrapper and make every divider full width while preserving row content alignment.
   - Coming Up: flatten both week groups and event rows; keep group labels and row type on the 24px line.
   - World Rankings: remove card wrapper; align tabs and rows to 24px; preserve the data-driven movement column.
   - News: remove article/card treatment and lead-image radius; make the lead image full bleed and keep only 10px thumbnail radii.
   - Continue to omit absent facts and empty sections exactly as today.

4. **Loading state**
   - Make the skeleton hero 360px, full bleed, and square.
   - Replace its raised board placeholder with a flat, canvas-grounded block and full-width separators so loading-to-content does not jump.

## Verification

- Run focused Tour Overview tests, TypeScript checks, and the project build.
- At 390x844, measure and report the CTA bottom edge against the fixed bottom-nav top; do not silently shrink any element if it overlaps.
- At 320px, confirm no horizontal overflow and verify the four-column board with a long player name.
- Check live, upcoming, and completed hero states at 390px for countdown/champion alignment.
- Check a no-photo slide at 360px for an intentional gradient fallback.
- Confirm the overview skeleton and loaded hero both measure exactly 360px and do not shift.
- Authenticated live-data checks are limited because this project uses an external unmanaged session; use deterministic rendered fixtures for state coverage and report that limitation.
