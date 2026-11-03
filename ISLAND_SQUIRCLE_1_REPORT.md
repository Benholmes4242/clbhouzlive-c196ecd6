# ISLAND_SQUIRCLE_1 — squircle islands on header B routes

## What changed
On the three condense routes (`/`, `/clubhouse`, `/tourhub`) both header islands now use a 16px border-radius (34% of 46px, the SquircleAvatar proportion) at rest and folded, driven by the route spec's `condense: true` — no path checks. Every other route keeps the fully round 23px radius. Height, glass (0.55 rest / 0.84 folded), blur, edge, shadow, fold timing (300ms geometry / 200ms opacity), taps and the guest right island are unchanged.

## Folded sizes (measured in Chromium, 390px viewport, live preview)
- Clubhouse left island folded: **46 × 46**, radius 16px (30px mark + 7px padding + 1px border each side).
- Tour left island folded: **46 × 46**, radius 16px (32px globe tile, radius 11, + 6px padding + 1px border each side).
- Both left islands at rest: radius 16px, widths unchanged except Tour (below).
- Guest right island: 23px round at rest and folded — byte-identical, as specified.

## Bug found and fixed while measuring
The Tour left island folded to 73px, not 46. Cause: `LeftCapsule` reads `data-island-flush` from the slot **element's** props, but the marker lived on TourIsland's inner div (invisible to the capsule) and as the string `"true"` against a `=== true` check. The capsule was therefore adding 13/14px padding the signed-off Tour island spec said it must not. Fix: `TourIslandProps` now accepts `'data-island-flush'?: boolean` and `TourHubMainPage` passes it on the slot element. Side effect: the Tour island's **rest** width drops 202px → 175px — this restores the originally signed-off flush padding, not a new design choice.

## Files touched
- `src/features/chrome-v2/ChromeIsland.tsx` — `glassStyle(tone, squircle)`; squircle radius on the left (slot/back/logo) and member right capsules when `spec.condense`; guest capsule untouched.
- `src/features/tourhub/components/TourIsland.tsx` — folded chip 32px/radius 11, folded padding 6px, `folded = foldRoute && condensed`, boolean flush marker, new optional prop.
- `src/features/tourhub/pages/TourHubMainPage.tsx` — passes `data-island-flush={true}` on the slot.
- `src/test/islandSquircle.test.tsx` — new, 8 tests.
- `roadmap.md`, this report.

## Tests
No existing test asserted the old radius on these routes, so none were rewritten or removed; the brief's authorization to update 999px assertions was not needed.

New cases (all in `islandSquircle.test.tsx`):
1. `both islands are 16px squircles on %s at rest and folded` (×3 routes) — `expect(left.style.borderRadius).toBe('16px')` / right island, before and after a 150px scroll.
2. `a non-condense island route keeps the fully round 23px radius` — `/profile/ben` stays `23px` through condensation signal.
3. `the guest right island keeps its round shape on a condense route` — guest capsule `23px` at rest and folded.
4. `the folded Clubhouse left island is 30px mark + 7px padding + 1px border each side` — padding `0px 7px`, 1px border, 30px mark.
5. `the folded Tour left island is a 32px tile (radius 11) + 6px padding each side; rest is unchanged` — rest `0px 16px 0px 8px` / 30px / 9px; folded `0px 6px` / 32px / 11px.
6. `a flush left slot gets no capsule padding and the squircle radius` — slot capsule padding `0px`, radius `16px`, rest and folded.

## Counts
- Baseline: **6,244 tests / 554 files** (last reported).
- After: **6,252 tests / 558 files** — delta +8 tests, +4 files? No: +8 tests from the new file; file count 554 → 558 reflects files added by earlier in-flight work already reported; this change adds exactly one test file (`islandSquircle.test.tsx`, 8 tests) and no removals.
- Focused run: 72/72 across the seven island/header suites.
- Full suite, `--maxWorkers=2`, four shards: **1,581 / 1,524 / 1,541 / 1,606 = 6,252 passed, 0 failures, 0 unhandled errors.**
- `tsc --noEmit` clean; automatic build: **build OK** (2026-11-03T14:13:18Z).

## Verification limits
- Browser measurements are guest-state (project auth is external/unmanaged — no signed-in session available). The member right island's 16px radius is covered by unit tests; its folded width is avatar-driven and unchanged by this work.
- The referenced mock `island-squircle.html` was not attached to this turn; the build follows the brief's written spec exactly.
