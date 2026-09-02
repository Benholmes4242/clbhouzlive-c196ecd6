# Discover Board Fix Pass

## Scope
- Restore the board hero as a full-bleed, notch-safe ~300px image with content anchored over the foot scrim.
- Move the applied-filter summary into a full-width bar below the hero and make the whole bar open filters.
- Move all seven board choices into the first filter-drawer section and retire the standalone picker.
- Rebuild the hero stat rail as four inline figure/label pairs: rounds, courses, members, days.
- Limit the surface to ten ranked positions while preserving a tie that crosses position ten; retain the pinned viewer row.
- Put each board's primary metric at the right edge and its secondary metric immediately left.
- Confirm the shared avatar fallback uses stable user-id-derived colours and initials.

## Technical details
- Keep ranking, facets, RPC positions/ties, query behavior, and maintenance flags unchanged.
- Use `get_board_page.total_count` for the hero rounds figure and See All; use the active board facet count for the filter footer while preserving unresolved-count behavior.
- Preserve the dark footer button, true-minus formatting, to-par colours, and amber restrictions.
- Update all six course locale files only for any new labels required by the presentation.
- Validate the rendered Discover route at mobile size and exercise the filter drawer.

## Known reference limitation
- The supplied Claude artifact URL currently returns “Page not found” from this environment, so implementation will follow the written acceptance criteria exactly and this limitation will be called out in the report.
