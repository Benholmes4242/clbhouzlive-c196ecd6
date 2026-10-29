# Rounds gate navigation — STOP report

## Cause and completed edits
- `GlobalBottomNavigation.tsx` rendered the fixed nav at **z-index 100**, not `Z.nav` (999). The body-portalled shade/card use **997/998**, so the actual nav layer was below both. No evidence supports an offending ancestor as the primary cause: the inspected `.app-shell`, `#root` and `.app-depth` rules do not establish an intervening nav stacking context. `.app-depth` is not a nav ancestor.
- Corrected the nav's existing mount to use `Z.nav`. No mount was moved, no ancestor was removed, and no gate layer was raised. This directly corrects the actual layer mismatch rather than relocating a portal on an unverified ancestor hypothesis.
- The scroll store can condense after a downward scroll beyond its 80px top zone; the gate did not hold an expansion lease. Added `pushForceExpand()` in a lock-dependent layout effect, releasing on unlock/unmount. Four new passing cases cover lease lifecycle, actual scroll-store condensation/expansion/release, Home navigation with unchanged nav mount, and Post or review opening.
- Shade/card portals, offsets, blur, triggers, copy, frozen page and no-handicap tile remain unchanged. Frozen mock differences (font, card padding/type, example count, nav geometry) were not adopted.

## Full suite and stop
Command: `bunx vitest run`

Before: last reported **4,403 tests across 452 files**. After: **4,407 passed / 1 failed / 4,408 executed across 453 files**. Delta: five new cases in `src/test/roundsGateNav.test.tsx`; no existing test modified, removed, renamed or rewritten.

Only failure (new):
```text
FAIL src/test/roundsGateNav.test.tsx > Locked rounds navigation > renders accessible visible nav above the body shade and card in the same effective stacking context
Error: expect(element).toBeVisible()

Received element is not visible:
  <div
  aria-label="Main"
  role="navigation"
  style="position: fixed; left: 0px; right: 0px; bottom: 20px; z-index: 999; pointer-events: none; display: flex; justify-content: center; opacity: 0;"
/>
❯ src/test/roundsGateNav.test.tsx:56:17
```
The real Framer Motion navigation remains at its initial opacity in this fake-timer fixture. The visibility assertion fails before the ancestor-comparison assertions, so effective stacking/accessibility verification is not claimed. No test was altered to make it pass; no rerun after the failure. **No pre-existing failures** appeared; all existing 4,403 cases passed.

Automatic build log: **build OK, 2026-10-29T09:40:16Z**.

## Browser limits
A pre-edit browser inspection at **390×844** visited `/amateur`, but the available external-unmanaged preview had **no mounted nav and no locked gate**. Therefore no authenticated ancestor `getComputedStyle` walk, nav transform/visibility confirmation, screenshot or `elementFromPoint` tap claim can be made for the member's actual locked state. Investigation of source and the passing controlled scroll-store test establishes the layer mismatch and condensation possibility, not a live-device measurement. Browser verification remains open and was not continued after the test stop.

## Every repository file changed
1. `src/components/GlobalBottomNavigation.tsx` — import/use canonical `Z.nav` instead of 100.
2. `src/features/explore-magazine/RoundsGate.tsx` — lock-only expansion lease and ownership comment.
3. `src/test/roundsGateNav.test.tsx` — five new regressions.
4. `roadmap.md` — request, completed edits and surviving verification stop.
5. `ROUNDS_GATE_NAV_STOP_REPORT.md` — this report.

No SQL, migrations, migration files, RPC/edge-function changes, feed_config changes, cap changes or native/Median configuration changes.