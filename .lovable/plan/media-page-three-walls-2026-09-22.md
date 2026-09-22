# Media page: three walls

## Goal
Give `/media` one compact header and three layouts suited to clips, long-form videos, and community media, while preserving counts, links, analytics, and the Amateur media block.

## Implementation

1. **Compact the shared page header**
   - Remove `total` and the duplicate item count from `LibraryHead`; keep only “Media” and reduce its top padding from 18px to 10px.
   - Remove every `AboutSection` wrapper from `MediaLibraryPage` and put each wall’s required gutter/full-bleed behavior directly on its own container.
   - Keep the exact stack: islands → title → kind chips → active content, with 12px from title to chips and 14px from chips to content.
   - Keep kind-chip counts sourced from the existing total queries, never loaded array lengths.

2. **Turn Clips into a paged wall**
   - Render the visible clip slice in a full-bleed, three-column grid using `MOSAIC_GAP` and `MOSAIC_RADIUS`.
   - Extend `MediaRailTile` additively with a parent-fill mode and an option to hide its caption; retain the existing required numeric `width` behavior as the default so every rail caller remains visually unchanged.
   - Pass `aspect="9 / 16"`, hide creator captions, keep the existing duration badge and `openWithOrigin` behavior, and pass `maxPlaying={2}` explicitly under the existing page autoplay group.
   - Reuse `PAGE` and `LoadMore` for clips; reset paging on kind changes as today.

3. **Create the long-form page card**
   - Add a dedicated full-width card beside `VideoRow`; leave `VideoRow` and `AmateurMediaBlock` untouched because the shelf row and page card are deliberately different shapes.
   - Use a full-width 16:9 thumbnail at `r.md`, existing duration badge, 34px canonical avatar/fallback, two-line 15/700 title, and one-line 12/600 muted creator.
   - Preserve the exact title fallback: title → course name → display name; collapse creator space when no name is available.
   - Render all long-form items with 22px between cards and no dividers or paging.

4. **Preserve the community wall**
   - Keep `MomentsGrid`, mosaic geometry, blocks, paging, and opening behavior unchanged.
   - Place `SortRail` directly below the kind chips within the 14px gutter, retaining canonical `RailChips`.
   - Inspect the adjacent chip rows at 390px; only use the existing smaller chip size if hierarchy is unclear, never underlines.

5. **Contained cleanup and coverage**
   - Remove the now-unused “items” string only if search confirms no other consumer.
   - Confirm the exported `LibraryChrome` component has no importer and report it as orphaned without deleting it.
   - Add focused tests for header/count removal, clip paging and grid contract, additive tile defaults, long-card fallback/creator spacing, and unchanged URL/analytics/open origins.

## Verification

- Record the 390px island-to-“Media” baseline distance before and after.
- Check every kind has no duplicate section wrapper between chips and content.
- Check Clips at 320px and 430px: three equal columns, 2px gaps, 9:16 frames, no horizontal overflow, paging, and total chips unchanged.
- Compare the Amateur clips rail before/after screenshots for pixel equality.
- Scroll the clips wall and record simultaneous players plus visible stutter with the explicit budget of two; reduce to one only if the device check demonstrates churn.
- Check long-form cards with one-line/two-line titles and a missing creator, and inspect the two adjacent chip rows at 390px.
- Confirm counts remain library totals after loading more, all three analytics/open-origin paths remain intact, focused tests pass, and the TypeScript check is clean.

## Explicitly unchanged

`VideoRow`, `AmateurMediaBlock`, existing rail rendering, `MomentsGrid`, mosaic geometry, all three kinds and `?kind=` default contract, count queries, `openWithOrigin` values, and analytics events.
