# Explore round visual treatments

## Goal
Replace the always-on Explore round chart with one of four data-led treatments on lead and standard cards: shape, ticks, distribution bar, or no visual. Pair cards remain unchanged with no visual.

## Implementation
1. **Pure treatment rule and tests**
   - Add a unit-tested `treatmentFor(item, shape)` helper beside Explore Magazine.
   - Apply first-match precedence: ace/albatross ticks; under-par/course-record shape; eagle-or-better or double-plus hole ticks; four-plus birdies or clean card bar; otherwise none.
   - Derive hole outcomes and fallback clean-card truth only from the already-fetched `HoleShape.holes`; use `StreamItem.facts` and existing record consequences for the remaining tests.
   - Keep unresolved distinct from settled-absent: `undefined` means the batched hole read is pending, `null` means it settled without usable detail. Pending ticks/bars reserve no visual and settled-absent rounds resolve to shape only when facts support it, otherwise none.

2. **Shared shape extension**
   - Extend `RoundShape` additively with opt-in line-only, labelled-baseline, finish-dot, and end-label behavior; defaults preserve every existing caller.
   - Where needed, extend its shared `TrajectoryLine` dependency with opt-in props whose defaults preserve current rendering.
   - Explore uses a 56px photo-foot band, no fill, a dashed LEVEL baseline, 2.2px trace, finish dot, and 1/18 labels.

3. **Explore-only visual components**
   - Add focused tick and five-bucket bar renderers using `RAMP_DIST` imports only.
   - Ticks encode strokes-to-par vertically: under-par down, over-par up, par flat; clamp to -3..+3 and outline/name the earliest largest event.
   - The bar omits zero-count buckets completely and shows proportional segments plus localized count labels.
   - Remove the visual band and its scrim entirely for `none`; never render any treatment on pair cards.

4. **Card wiring and copy**
   - Pass hole-read readiness into `ExploreCard` without adding a query or changing the stream data contract.
   - Make the gross score always white while retaining canonical red only for an under-par to-par verdict.
   - Add interpolated standout-hole labels to all six course locale files.

5. **Verification and report**
   - Run the focused unit tests, project typecheck, and existing build verification.
   - Compare the friends rail and scorecard sheet before/after where runtime data is available; verify 320px and 390px geometry with no horizontal overflow.
   - Measure the real visible-page treatment mix when authenticated runtime data permits; otherwise mark it unverified rather than infer it.
   - Report the cheap cadence extension point without implementing it: client fallback cadence and the RPC cadence key/tail are the two paths that would need the treatment signal.

## Technical note
`RoundShape` is directly called by the friends rail, Amateur hero, and Explore card. The scorecard post and scorecard sheet share its underlying `TrajectoryLine`, not `RoundShape` itself. The implementation will preserve both layers' defaults and will report this correction explicitly.
