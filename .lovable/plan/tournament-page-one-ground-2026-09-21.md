# Tournament page: one ground

## Outcome
Make the tournament detail page read as one continuous dark ground. Only inset, rounded cards remain on the lighter raised surface.

## Changes
- Replace the raised fill with `PAGE_CANVAS` on the full-width, square-corner bodies for:
  - the hero figures strip
  - The Margin
  - Round of the Day
  - the tournament-page mini leaderboard
  - Story
  - Event Info
  - the empty Moments action row
  - the full-width Moments sheet list body
- Keep the moment tiles, tee-time cards/chips, and The Course panel on `SURFACE` because they are inset and rounded.
- Leave `TeeTimesBand` unchanged: its button is inset, bordered, and rounded, so it is a card under the stated test. It is not mounted by the current tournament page.
- Pass `SHEET_SURFACE` only from `FullBoardSheet` into `BoardTable`; do not change `BoardTable` defaults, its lifted column-header strip, or any other caller.
- Update the stale MiniBoard surface comments so they describe the new page-ground behavior without changing its layout, rows, pack track, or data logic.

## Separation
Existing section eyebrows already separate the major blocks. Story, Event Info, Moments rows, and leaderboard rows already carry hairlines. No new divider is expected; add a `HAIRLINE_INK_8` rule only if the rendered page reveals an unjoined boundary after the fills match.

## Verification
- Check completed and live tournament detail pages at 320px, 390px, and 430px.
- Confirm one continuous ground from the figures strip through Event Info, with only inset rounded cards lighter.
- Open Full Board and compare it with “How the field scores”: title/header and rows must share one sheet ground while the board column header retains its 4% lift.
- Confirm every section remains visually distinct and report any added hairline precisely.
- Run the relevant tests and project build; make no SQL or migration changes.
