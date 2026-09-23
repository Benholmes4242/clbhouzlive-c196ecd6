# Canvas Stage 1 — Four-step colour ramp

## Goal
Repaint the member app onto the new dark four-step ramp while preserving the legacy light-route values and every excluded visual system.

## Implementation
1. Update the canonical member surface exports in `src/lib/tokens/surfaces.ts`:
   - Canvas `#0A0A0C`: route, immersive feed, composer shell, app shell, desktop gutter, Discover shell, post deep-link, Echo history, suspension, and inverted-control ink; update both dark status-bar encodings to `FF0A0A0C`.
   - Panel `#16161A`: sheet, member panel, feed card, composer panel, Tour Hub raised, and Echo history panel.
   - Cell `#1E1E23`: member cell, Echo history action, slate control, and near-black control.
   - Raised `#27272E`: Echo raised surface.
   - Keep all three legacy light-route exports unchanged.

2. Update the member theme variables in `src/index.css`:
   - Set `--bg-page` and the canonical CSS-owned surface values to their matching new ramp colours.
   - Set `--background`, `--card`, `--popover`, `--muted`, and `--secondary` to the exact supplied decimal HSL channels, including dark-only compatibility scopes that otherwise override the root values.
   - Assign `--surface-card` to Panel, `--surface-alt` to Cell, `--surface-slate` to Raised, and `--bg-modal` to Panel. These roles respectively represent standard cards, inset/secondary controls, the strongest elevated utility tier, and sheet/modal bodies.
   - Update CSS alpha variables derived from changed canonical tokens so they retain their alpha while following the new token channels.
   - Leave unrelated route-specific, chart, map, media, skeleton, fallback, admin, and neutral black/white layers unchanged.

3. Change only the shared Bottom Sheet backdrop from black at 0.4 alpha to black at 0.55 alpha. Update nearby stale comments that explicitly state the old sheet colour, without changing behavior.

4. Rewrite—not remove—the existing canvas guard expectations:
   - Cover every changed canonical export and both status-bar encodings.
   - Preserve the current surface-alpha, ink-alpha, single-owner, and independent ink/light-canvas checks; update only changed surface channels.
   - Add a conversion assertion that parses the five named HSL declarations from `src/index.css` and proves each round-trips to the hex in its comment.

## Verification and report
- Run the focused canvas guard test, TypeScript validation, and diff whitespace checks.
- Programmatically verify every supplied HSL triple converts to its documented hex.
- Open accessible signed-out member screens at the current mobile viewport and representative desktop width; record visible regressions without fixing excluded systems.
- Report every token old → new, every CSS variable and verified hex, the four `surface-*`/modal role choices, the intentionally stale `NEAR_BLACK_CONTROL_SURFACE` name, visible mismatches, and screens unavailable behind authentication.
