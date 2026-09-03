# Hero Strip Height Canon

## Scope
- Add `HERO_STRIP_H = 132` beside `HERO_MIN_H`, documenting the three intended consumers while leaving the existing full-stage and legacy overview constants unchanged.
- Repoint Discover, Tour Overview `PhotoBand`, and tournament-detail `HeroSection` to the shared strip token, preserving each surface’s existing safe-area/chrome composition.
- Add strip-specific overview height exports, make `OverviewHero` and `TourHubOverviewSkeleton` use them, and retain the legacy overview exports unchanged for all news/story surfaces.
- Reduce only the Tour Overview and tournament-detail title sizes/line heights specified in the brief; preserve two-line clamping, title treatments, scrims, board row count, ticker offset, and all below-hero content.
- Correct stale height comments in `OverviewHero`, `PhotoBand`, and tournament detail so they describe the new strip contract without implying unrelated heroes share the old hard height.

## Validation and report
- Verify at 390×844 that all three surfaces use a 132px content band while their documented inset/chrome additions remain intact; specifically check overview photo→ticker→board seams and tournament title clearance.
- Measure Tour Overview offsets before and after for the first board row, Full Leaderboard row, and What’s Coming Up; confirm six rows and ALSO OUT position 7 remain unchanged.
- Test the longest available tournament title in overview and detail for two-line containment, venue/moment visibility, and clipping.
- Compare course detail, Courses, player, and news/story hero dimensions before and after to confirm they are pixel-unchanged; verify the overview skeleton matches the new overview total.
- Inspect representative tournament photography at 132px and report any overly dark image without changing the shared scrim.

## Audit findings and constraints
- `OVERVIEW_HERO_HEIGHT` currently has a false comment claiming parity with Courses/Course Detail; those surfaces use `HERO_MIN_H`, not `PHOTO_BAND_HEIGHT`. Fix the comment only.
- `TOTAL_HERO_HEIGHT_TARGET` has no executable consumer; only comments refer to it. Leave the export untouched but report it as dead/stale.
- `ChampionsHonoursBoard`’s local 132px photo band is a separate course-honours preview, not one of the three canonical strip consumers; keep it local to preserve the explicit consumer boundary.
- “Same height” is interpreted as the same 132px **content height**: Discover and Overview add the safe-area inset, while tournament detail intentionally adds `max(inset, 48px)`, so total rendered CSS heights can differ.
- `TournamentPageSkeleton` remains on `HERO_MIN_H` because the brief explicitly lists it among unchanged consumers. This means it will not mirror the resized tournament-detail hero; report this contradiction rather than expanding scope.
- The latest Discover implementation is already an uncaptioned 132px strip after the superseding spacing brief; this work only replaces its local literal with the shared token.
