# BRIEF_EXPLORE_REVIEW_TILE_A1

- [x] Refactor lead review copy into identity, two-line quote, and optional breakdown rail
- [x] Move review photo count into the top-right glass chip
- [x] Remove only the five verified orphan locale keys across six locales
- [x] Add focused review-tile accessibility, truncation, scope, chip, and regression tests
- [x] Verify six-locale label widths at 390px, Explore tests, typecheck, and screenshot

## Explore news alignment
- [x] Match photo-led news hierarchy to Tour Overview and remove member attribution.
- [x] Verify focused Explore tests and typecheck.

## Personal Bests restore
- [ ] Prove `get_personal_bests(90, 30, 2)` returns rows under authenticated claims; blocked because the external read role cannot assume `authenticated` or execute `can_view_handicap`.
- [ ] Build and mount `PersonalBestsShelf` in Explore Magazine using the existing hook and `StandoutTile`.
- [ ] Preserve server copy and server-side dedup/widening; add no cross-section member budget or empty state.
- [ ] Verify 320/390/430, screenshot, focused tests, and typecheck.
