# Discover Board Type and Sheets

## Scope
- Replace the board hero eyebrow with the existing localized “The amateur circuit” label.
- Apply caps through CSS `textTransform` only to board titles, applied-filter text, sheet headers, and the filter trigger; align their tracking and remove amber from the page trigger.
- Rebuild See All as a canvas-matched, fixed-chrome sheet with an uppercase title row, subject/count block, shared board column header, and an independently scrolling contained row list.
- Simplify the filter sheet without removing options: canvas background, fixed header/footer, contained internal scrolling, revised row/group spacing, uppercase board value, and default-vs-changed value emphasis.
- Preserve server-provided `pos` and `is_tie`, all existing ranking/filter/count behavior, and the current board surface geometry.
- Update the six course locale files for any new presentation labels while keeping source and locale punctuation ASCII-safe.

## T7 hold
- `unfiltered_pos` is not present in the current generated RPC type or `BoardRow` contract, so this pass will ship T1-T6 only.
- Do not add SQL or speculate about the RPC response. Report T7 as blocked until the separately managed RPC change lands.

## Verification
- Check the diff contains no new `toUpperCase()` calls or hardcoded surface hex values.
- Exercise the filter root and a drilldown, confirming option selection returns immediately and default/changed values use the requested contrast.
- Open See All and verify the title, subject block, column header, retained RPC positions/ties, internal scrolling, safe-area clearance, and no page-behind scroll.
- Validate the Discover route at mobile size and check browser console output.
