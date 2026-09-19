# P2 — Scores scope row collision fix

## Changes
- Remove the separate place control from the Scores row only; keep Courses unchanged.
- Keep place/course filtering inside the existing board filter panel and preserve all board filter state and query arguments.
- Make the scope-chip region the only horizontal scroller, with `flex: 1 1 auto`, `min-width: 0`, no wrapping, hidden scrollbar, and fixed-width chips.
- Add a non-interactive 26px right-edge canvas fade and a hairline separator before the single pinned board control.
- Keep the board label at full size without truncation and leave the view chips unchanged.

## Verification
- On Scores, set the board to “Most improved” and measure at 320px and 390px: pinned-control width, chip-track width, fully visible chips, and overlap.
- Scroll the chip track to confirm World becomes visible and the fade remains at the track edge.
- Confirm All, Watch, and Courses retain their existing controls and layout.
