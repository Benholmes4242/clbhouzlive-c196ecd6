# Courses browse rebuild

## Confirmed count diagnosis

- `get_stat_browse_facets.played_total` is **217** because it counts `stat_browse_base`, not every played course.
- `stat_browse_base` only admits rounds with a course ID, gross score, course par, and 18 holes. The direct population is **256 distinct course IDs** in `gam_round_stats`; **39 courses** have played/mapped rounds but no round satisfying that stricter analytics gate.
- The facet RPC's country, region, and lens availability figures deliberately use the same analytics-ready base. Its only runtime consumer is Courses browse. Those eligibility semantics remain unchanged; the new strapline will use explicit all-played and rated totals so it cannot confuse the two populations.

## Implementation

1. **Truthful heading and count contract**
   - Add explicit `rated_total` and `all_played_total` fields to the existing facet response while preserving `played_total` and every existing lens count.
   - Define the figures in code: rated = distinct courses with an aggregate community rating; played = distinct mapped course IDs appearing in round stats; browse/lens eligible = the existing 18-hole scored analytics population.
   - Render: “95 of the 256 courses members have played here carry a rating.”

2. **Flat browse card**
   - Add a browse-specific additive presentation to the card tree; existing card defaults and other consumers remain unchanged.
   - Use a 196px square-edged photograph, spelled-out held ranks, over-photo identity/score/count, then optional round facts and optional category breakdown.
   - Remove duplicated score/review figures, borders, card ground, radius, old enrichment bands, and nonessential card rows from this browse presentation only.

3. **Category scores and spacing**
   - Return the four aggregate category scores in browse rows. Render the block only when at least one exists.
   - Scale tracks from 6 to 10. Use canonical tiers unchanged: Exceptional ≥9.0; Excellent 7.5–8.9; Good 6.0–7.4; Fair 4.0–5.9; Poor <4.0. Only fills take tier colour; figures stay INK.
   - Preserve 11px photo-to-facts, 13px facts-to-bars, 6px track-to-label, and 32px between cards.

4. **Controls and heading**
   - Keep one filled applied-filter row: All areas, All regions, Edit. Remove the page-level search circle.
   - Replace the sort dropdown with outline `RailChips`: Best rated, Most played, Hardest, Easiest.
   - Use shared `AboutSection` and `DiscoverSectionHeading`; active board is the heading and its qualifying count is the right meta. Preserve URL state and existing analytics event names.

5. **Hero and reviews**
   - Recompose the Courses hero to 260px with the existing image/scrim and whole-hero navigation: “BEST ROUND TRACKED HERE”, course name, then location, rounds, gross score, and holder on one line. Remove the separate button.
   - Keep Latest Reviews behavior, but present it with a section heading and 32px separation on both sides.

6. **Verification**
   - Re-run direct read-only counts and inspect RPC output.
   - Check rated and unrated/no-category cards, 9.6 vs 8.8 bar geometry, pluralisation, all boards/filters, review-slot rhythm, hero navigation, and 390px overflow/card density.
   - Run the project typecheck/tests available through the repository harness; no unrelated shared component or token changes.
