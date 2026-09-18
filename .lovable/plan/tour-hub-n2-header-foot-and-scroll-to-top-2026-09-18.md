# Tour Hub N2 — header, foot, and scroll-to-top

## Scope
Correct the shared Tour Hub sub-tab shell without changing `/tourhub` route classification, the overview’s immersive hero, News content composition, navigation behavior, or shared bottom-navigation clearance.

## Implementation

1. **Make safe-area ownership match the route state**
   - In `TourPageShell`, use the header’s self-owned inset only when the pathname is exactly `/tourhub`, where query-param sub-tabs inherit the immersive route classification.
   - Keep `inset="shell"` on pushed `/tourhub/*` routes, where `.app-shell` already owns the safe area. This avoids double-paying the notch for existing Tournament, Player, College, and Compare callers.
   - Replace the inaccurate safe-area comment with the exact-route versus pushed-route rule.
   - Remove `minHeight: '100vh'` from the shell root while retaining its canvas background.

2. **Move hub sub-tabs below the measured fixed header**
   - In `TourHubMainPage`, replace the sub-tab wrapper’s `var(--sat)` clearance with `var(--tour-header-h)`.
   - Pass `immersiveHero={false}` for the News tab so its lead photograph begins below the opaque header and uses the compact kicker offset.
   - Leave the overview branch untouched so its hero still reaches physical y=0.

3. **Use the canonical bottom clearance only**
   - Remove the extra `paddingBottom: 24` from `NewsTab`.
   - Do not add any replacement number; `PageRoot` remains the sole `NAV_CLEARANCE` owner.

4. **Mount one shared scroll-to-top control**
   - Add `ScrollToTopGlass` as the last child of `TourPageShell` so News, Schedule, Players, Leaderboards, and pushed Tour pages share the resolved `#root` scroller behavior.
   - Remove Schedule’s existing local instance to prevent two portalled controls.
   - Preserve the overview’s existing standalone instance because the overview does not render through `TourPageShell`.
   - Verify the control remains absent while the story reader or another registered full-screen surface is open.

5. **Correct stale dependent comments and add regressions**
   - Update comments in `TourHubShell` and the leaderboard skeleton that still describe the old in-flow/min-height arrangement.
   - Add focused coverage for exact `/tourhub` self-inset behavior, pushed-route shell inset behavior, measured header clearance, non-immersive News hero, one arrow per tab, and removal of extra News foot spacing.
   - Record N2 in the project roadmap.

## Verification and report

- Run focused Tour tests and the TypeScript check.
- Use the live preview at 390px and 320px widths to capture the News tab halfway scrolled and confirm the notch strip stays opaque.
- Measure last-row-bottom to nav-pill-top on Overview and News before and after; report all four values without compensating if they still differ.
- Confirm the Overview hero remains at y=0 and has exactly one scroll-to-top control.
- Check a short/empty Players state and the other hub sub-tabs for full-canvas paint after removing the shell minimum height.
- Confirm pushed Tour pages retain one safe-area payment and are not obscured by the fixed-header behavior used only on `/tourhub`.
- If native safe-area values cannot be reproduced in the browser harness, state that limitation separately rather than changing the proven `AppHeader` self branch.
