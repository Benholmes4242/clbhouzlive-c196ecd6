# Explore scope-kicker verification

The requested own-round amber rendering case has no live render path:

- `ExploreCard.tsx:1014` uses `rendersOnPhoto(item, size)`.
- `cardTreatment.ts:35–39` returns false for every round and every pair.
- The scope kicker is only mounted inside the `onPhoto` branch at `ExploreCard.tsx:1562–1595`; standard and lead round cards suppress it.

The colour-only change preserves that existing behaviour. A non-own review scope can be rendered and tested white. An own-round amber rendering test would require exposing a currently hidden label or forcing a false layout with a mock; neither is authorised by this colour-only brief.

The remaining ownership changes, genuine rendering tests, photo contrast checks and full-suite verification can finish independently. No passing test is removed or rewritten because of this gap.

Ben confirmed **Keep it hidden** at 10:05 UTC on 23 November 2026. The existing layout is preserved and its dormant amber branch remains explicitly unverified; no layout change is pending.
