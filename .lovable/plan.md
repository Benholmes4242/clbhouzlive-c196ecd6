# G1 — stable glass cards, scorecard foot, and story press

## Confirmed findings

- Both floating cards are intrinsically centred, so late content changes move both edges. The scorecard currently gates only round detail and the overlay forces a 150ms reveal; the review has no readiness gate.
- The member scorecard also changes height from course context, reactions, round-post comments, and hole-field data. The review changes height from fallback prose, media, and rating aggregates.
- The scorecard foot still uses the non-shrinking 260px links basis, so it wraps at widths below the current 430px preview.
- `viewProfile` and `viewCourse` remain English in de/es/ja/ko. The three shared story shapes still inherit active scaling from the shared Button.

## Build

1. Add one shared 350ms card-open gate that freezes its decision once per open: reveal immediately when every height-affecting query is settled; otherwise reveal at the cap and permanently suppress still-unsettled optional blocks for that open. Errors count as settled. Page-mode scorecards remain ungated.
2. Expose settled state from the reactions and comments hooks, compose all five member-scorecard query states in `RoundDetailSheet`, and pass the frozen inclusion decision into the scorecard. Preserve core round empty/error handling without rendering a glass skeleton.
3. Lift the review fallback, media, and aggregate reads to `ReviewBottomSheetPortal`, compose their settled states there, and pass frozen data plus the reveal decision into `ReviewBottomSheet`. Preserve viewer stacking and scroll position.
4. Add reusable prefetch functions backed by the exact existing React Query keys/fetchers. Trigger scorecard detail/context prefetch on press at scorecard entry controls, and review fallback/media prefetch on press at the shared review CTA paths before opening.
5. Add gated instrumentation that records settled-before-cap versus cap-hit counts for scorecard and review opens, including a readable session rollup for verification.
6. Check horizontal round paging with unequal-height rounds. If it jumps, measure only at page commit, animate card height for 220ms on the entrance cubic-bezier, then release to `auto`; add no idle observer.
7. Replace the scorecard exits with a vertical foot: optional left-aligned engagement band, then an equal-column icon trio sized from the actions present. Use Lucide `User`, `MapPin`, and `Share`, 44px targets, short labels, and the existing single interaction guard.
8. Repoint the six locale keys to short labels, including proper de/es/ja/ko translations and regenerated en-XA strings.
9. Replace only HeroStory, FeatureStory, and WorkhorseRow navigation wrappers with native buttons. Keep their layout and accessibility, add opacity-only 120ms press feedback, and remove all story-shape transforms without changing the shared Button.

## Verification

- Test all readiness combinations, error settlement, frozen cap suppression, warm immediate opens, no glass skeleton, and session cap counters.
- Measure first-paint and settled heights for cold/warm member and review cards; verify equality. Test fullscreen review, feed review, 190-word scrolling, and preserved media layering.
- Compare unequal-height rounds during paging and verify any height animation is commit-only and returns to intrinsic sizing.
- Capture the scorecard foot at 320px and 390px with engagement and all three actions; report foot/card heights and label overflow across all six locales.
- Verify the three story shapes dim without scaling while News tab and Overview geometry remain unchanged.
- Run focused tests and TypeScript checks; rely on the project harness for build validation. Authenticated runtime measurements will be reported only where the available preview session permits them.
