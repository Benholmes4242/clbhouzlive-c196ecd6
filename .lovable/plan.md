# L1 — Leaderboard masthead place, lines, and search

## Scope
Change only the leaderboard masthead and the shared tournament metadata/search-field support it consumes. Leave `BoardTable.tsx`, board rows, grid, colours, chips, and all content below the chips unchanged.

## Implementation
1. Add a focused `venuePlace` resolver beside the leaderboard:
   - Include the supplied 41-code ISO-3 nation map and the complete 50-state-plus-DC abbreviation map.
   - For `GBR`/`IRL`, prefer only the linked course `sub_country`; otherwise use the ISO-3 nation.
   - For `USA`, prefer a recognised expanded `venue_state`; otherwise use `United States`.
   - For every other country, use only the ISO-3 map.
   - Fail closed: unknown codes produce no nation, so the masthead shows the city without a dangling comma or raw code.
2. Extend `useTournamentMeta` additively with `golf_course_id`, `venue_state`, and the linked golf course's `sub_country`. Keep its query key and all existing fields/consumers unchanged.
3. Replace the single metadata array in `LeaderboardTab` with two independently conditional lines:
   - Place: venue · resolved city/nation.
   - Figures: par · yards · field average, preserving the current typography and volatile field value last.
4. Extract the canonical 44px search box from the global search overlay's `SearchField` into a ref-forwarding sibling component.
   - Preserve the overlay wrapper, Cancel control, safe-area spacing, hairline, submit handling, and exact field appearance.
   - Reuse the extracted box in the leaderboard with its existing state, autofocus ref, and translated placeholder.
   - Use the canvas field treatment without local background, border, or radius overrides.

## Verification
- Add unit coverage for all venue-resolution branches, the supplied event scenarios, unknown-code failure, and complete US-state expansion behavior.
- Run focused tests and the TypeScript check.
- Capture the global search overlay before and after extraction and compare its field geometry/paint.
- Check the leaderboard at 320px and 390px: fixed place/figure lines, graceful within-line wrapping, canonical search sizing and clear control, and no raw country/state codes.
- Runtime verification will use public preview data where available; authenticated-only event states will be reported rather than simulated.
