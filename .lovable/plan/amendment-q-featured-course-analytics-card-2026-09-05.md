# Amendment Q — Featured Course Analytics Card

## Goal
Keep the featured 132px photograph full-bleed while restoring every analytical block beneath it to one inset panel that is visually identical to an opened course tile panel.

## Changes
- Introduce one shared course analytics card wrapper used by both the featured course and opened mosaic tiles.
- Leave the featured photo edge-to-edge and place the shared panel 10px beneath it, inset 14px from both page edges.
- Keep the low-round line, course-wide basis, chart, By par, hole-by-hole detail, and View course permanently visible in the shared panel.
- Remove featured-only full-bleed block padding so all internal hairlines stop at the panel padding.
- Use the tile panel’s fill, 12px internal padding, 12px radius, clipping, content order, gates, and analytical components for both contexts.
- Set the gap from the shared featured panel to the first tile row to 20px while preserving the tiles’ 14px page alignment.

## Technical details
- Collapse the current `mode="featured"` presentation branch in `CourseHolePanel` so featured and tile callers render the same internal structure and surface assumptions.
- Keep loading height stable inside the shared card and preserve all chart interaction and score-colour behavior.

## Validation
- Run focused TypeScript/build checks.
- At 390px width, verify photo/card/tile alignment, 10px and 20px gaps, inset hairlines, no featured chevron or collapsed content, and measure the complete expanded section height.
- Confirm the below-sample state remains low-round plus one explanatory line inside the card.
