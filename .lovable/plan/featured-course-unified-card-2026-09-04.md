# Featured Course Unified Card

## Goal
Turn only the featured course into one continuous card: its photograph, low-round line, and core analytics are visible on arrival; the hole-by-hole detail and course link expand within that same card.

## Changes
- Replace the featured mosaic tile plus detached panel with one full-width `A.PANEL` card using a single 10px radius, clipped full-bleed photograph, and one outer edge/shadow.
- Keep the 132px photograph treatment and overlaid course details unchanged, but make the photograph toggle the featured card’s extra section without adding the tile selection ring.
- Split the analytical panel into two presentation modes:
  - **Featured:** low round plus “How it plays” and “How each par plays” always visible; a full-width “Hole by hole” disclosure row reveals the distribution, extremes, and “View course” row inside the card.
  - **Tiles / See all:** retain the existing full panel and current interaction unchanged.
- Use the section’s existing single `openId` state for both the featured disclosure and the four tiles, so opening either closes the other.
- Preserve the sample gate and field-of-one guard. Below five detailed rounds, show only the photo, low-round line, and explanatory copy with no disclosure or course-link row.
- Keep the analytical loading footprint stable so the lazy result does not shift surrounding mosaic rows when it settles.

## Technical details
- Add a featured-mode contract to `CourseHolePanel` so its existing query, chart, par bars, distribution, gates, and interaction logic remain authoritative rather than duplicating data reads.
- Add a shared disclosure row matching terminal-row spacing and typography, with a muted chevron that rotates 180° when expanded.
- Preserve `touchAction: none`, pointer capture, selected-bar label behavior, amber member marks, score colors, and all existing course routing.

## Validation
- Type-check and run focused course tests.
- At 390px width, measure the default section/card height and verify the card is visually continuous, the featured card has no ring, and no empty disclosure appears for a gated course.
- Drag horizontally across the always-visible chart and confirm hole selection changes while the page beneath does not scroll.
- Verify photograph and disclosure row toggle the same content, and opening any small tile collapses the featured disclosure.
