# P4 — Filter sheet and Courses divider

## Changes
- Extract the existing Scores row separator into one shared control-row divider and render that same element between scope chips and the pinned control on Scores and Courses.
- Replace the filter sheet's default-versus-changed selected styles with one selected chip treatment: 14% white background and ink text, with no pure-white fill.
- Preserve all facet counts and zero disabling logic, but hide printed counts on Rankings and Feats only.
- Move Handicap from the root chip section into a drill-down row showing the selected band; render the existing band chips and counts on the pushed screen.
- Preserve section order, filter state, RPC arguments, footer, Showing line, reset control, Where, and Courses drill-downs.

## Verification
- Measure the visible panel content height before and after at 320px and 390px.
- Confirm every selected chip uses one treatment and no pure-white chip fill remains.
- Confirm ranking/feat counts are hidden while narrowing-axis and Handicap drill-down counts remain.
- Confirm zero-count boards remain disabled without displaying their number.
- Confirm Handicap shows its current value and Courses uses the exact shared divider already used by Scores.
