# Canvas Stage 3 — Arrival Screens

## Goal
Move the four named signed-out arrival screens onto the dark member ramp without leaving a mismatched light status-bar band.

## Implementation
- Confirm route chrome before editing and keep each named path on opaque dark, non-immersive chrome: CANVAS status-bar ground with light icons. The current classifier now returns dark chrome globally, so no route-classification code change is expected unless verification exposes a conflicting path/state.
- Repaint `AuthCallback`:
  - preserve both radial-gradient geometries and the two existing amber glow stops;
  - derive page grounds from CANVAS and the native callback card from PANEL;
  - route text, rules, spinner, and shadow through the shared ink/surface helpers.
- Repaint the shared join/invite landing:
  - CANVAS page, PANEL value rows, shared dark-surface ink tiers;
  - retain amber branding and the existing action treatment, using `INK_ON_LIGHT` where dark ink is required on amber.
- Repaint the 404 with CANVAS and shared ink tiers while retaining its amber action.
- Repaint the deleted-account terminal screen with CANVAS and shared ink tiers. This intentionally reverses its explicit `LIGHT_ROUTE_CANVAS` decision. Convert its primary action to the established white-button/dark-ink treatment and keep the secondary action quiet on the ramp.
- Do not alter Apple/Google white sign-in buttons or any screen beyond the four named files. Add focused regression coverage for token use and route chrome classification.

## Verification
- Run TypeScript checks and the relevant/full test suite, distinguishing any pre-existing failures.
- Open signed out: `/auth/callback`, `/join`, `/i/<test-code>`, and an unknown path for the 404.
- Open the deleted-account screen signed out by restoring its existing session deletion flag, without fabricating an authenticated account.
- At mobile size, inspect each screen and verify the page, safe-area shield, document/body ground, and status-bar intent agree; record what is visibly rendered.
- Report every other outside-the-app/deep-link/error/recovery screen found by the audit, its current light/dark state, and leave it unchanged.

## Route chrome report shape
For each route, record its prior `dark / immersive / canvas-dark` classification and its post-change classification, including the deleted-account overlay’s dependence on the route beneath it.
