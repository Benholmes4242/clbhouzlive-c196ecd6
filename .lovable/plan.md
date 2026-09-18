# Review Sheet R1 Restraint Pass

## Scope
- Keep `ReviewBottomSheet` as the existing opaque bottom sheet: unchanged scrim, solid panel, drag handle, dismissal, scrolling, footer, media viewer layering, and entry points.
- Add the 18 Sep decision note to the file header without altering the load-bearing stacking comments.

## Header changes
- Remove only the sheet’s ghost rating numeral and `REVIEW / date` eyebrow.
- Rebuild the pinned header as the scorecard’s two-column shape:
  - Left: course name at 19px/800 and location at 12px, 2px below.
  - Right: rating at 34px/800 with tabular numerals and the uppercase amber verdict at 10px/800, 3px below.
- Preserve truncation and stable column sizing so short and long course names remain balanced at 390px and 320px.

## Reference and spread
- Replace the three-cell repeated-rating comparison with one muted 11.5px line: `Community average 7.9, from 14 ratings`.
- Keep the existing minimum-rating gate and aggregate data source unchanged.
- Remove sub-score bars and tracks; render only available sub-scores as equal columns with 15px/800 tabular figures and 9px/800 uppercase muted labels.
- Preserve omission and rebalancing when categories were skipped.

## Verification
- Add focused rendering checks for the new header, reference sentence, four and two sub-scores, missing prose, and missing media.
- In a real browser, compare the review and scorecard headers over successive captures; inspect short and long course names at 390px and 320px for balance and horizontal overflow.
- Verify a 190-word review still scrolls, the handle still dismisses, the footer remains pinned, and the Clubhouse and fullscreen-viewer entry paths retain their stacking behavior.
- Run focused tests and the TypeScript check; project harness remains responsible for the build.

## Technical notes
- Changes remain inside the review sheet presentation and its focused tests; no data, RPC, store, routing, z-index, or shared scorecard behavior changes.
- `ReviewGhostNumeral` remains available for its other callers; only this sheet stops importing/rendering it.
