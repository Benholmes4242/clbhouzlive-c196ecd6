# Explore circle handicap row

## Build
- Extend the circle-round enrichment to read each surfaced member's active WHS connection with `handicap_visibility` and `eg_visible`; show handicap data only when visibility is exactly `public`, `eg_visible` is true, and an active connection/current snapshot exists. Do not rely on RLS for this display gate.
- Carry the disclosed current handicap index and the existing `gam_round_stats.delta_index` through the circle row. Keep null/zero delta absent and never derive movement from before/after values.
- Add opt-in caption controls to the shared standout tile with unchanged defaults: one-line ellipsized player name, an always-reserved second caption line indented beneath the name, and no top-right photo label for Circle tiles.
- Render `HCP {index}` at one decimal plus the non-zero round delta at one decimal with true minus, tabular figures, and the canonical dark index-movement green/red tokens. Index and delta share one privacy gate.
- Leave the score chip, data ordering, taps, sheets, analytics, other tile consumers, and accepted Explore spacing unchanged.

## Verification and report
- Add focused tests for disclosure gating and delta formatting: public/private/missing connection, `eg_visible=false`, null/zero/cut/rise.
- Check 320px and 390px geometry for one score chip, empty top-right, one-line name ellipsis, no handicap-row wrap, and equal tile heights.
- Capture public, private, and no-delta examples where authenticated data permits; otherwise report the exact runtime limitation without inferring a pass.
- Report the source column/helper/formatter and audit data availability and implementation cost for `This week at {club}` and round cards without changing those surfaces.

## Technical details
- Shared tile additions remain optional so existing callers render byte-identically.
- The accepted brief overrides CircleShelf's older no-window note that the date must remain over the photo; Circle removes that date to keep the photo to one chip and an empty top-right corner.
