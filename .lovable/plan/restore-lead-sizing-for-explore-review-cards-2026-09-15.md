# Restore lead sizing for Explore review cards

## Build
- Restore the full-width sizing decision so every review uses the existing `lead` preset, regardless of position or Explore view; all other full-width cards remain `std`, and reviews remain excluded from pairs.
- Keep the lead preset as a genuine `CardSize` path: 340px minimum photo height, `r.lg`, 22px italic white quote, 1.12 line height, -0.02em tracking, and a three-line clamp.
- Preserve the existing rating chip, reserved 48px chip lane, copy scrim, 16px bottom lane, and no `REVIEW` prefix.
- Retain the current lead kicker and who-line metrics because commit `d1ed6e5b7d` used the same 9px kicker and 12px who-line as today.
- Leave round cards at `std`, with copy below the photograph.

## Tests and checks
- Update card tests to assert a one-line review has a 340px minimum height and a long review keeps that minimum while remaining able to grow.
- Assert lead quote typography, three-line clamp, `r.lg`, and at least 12px between the rating-chip lane and the kicker.
- Add the sizing-decision test showing reviews at positions 0 and 5 both resolve to `lead`, while rounds remain `std`.
- Run focused tests, type checking, and the project build.
- Verify the rendered Explore view at 320px and 390px and confirm page width has no horizontal overflow.

## Existing contradiction resolved by this brief
- Current comments say the lead size is retired and every full-width card is `std`. This brief supersedes that rule only for reviews; position still does not earn height.
