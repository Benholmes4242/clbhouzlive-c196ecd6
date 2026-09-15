# Explore earned cards, video inset, and rail cadence

## Goal
Give important Explore items the integrated text-on-photo treatment without flattening the page, make long-form video match All while preserving Watch, and rebuild Scores so feed cards separate every rail.

## Build
1. **Earned hero treatment after ranking**
   - Add a pure, tested treatment pass after the existing rank-card gate and before layout blocks.
   - The first ranked item is always `hero`.
   - Later items are eligible only for `record_taken`, `record_lost`, `rank_up`, an ace, an albatross, or an under-par round.
   - Enforce a positional maximum of one hero in every four cards. A blocked eligible item stays in place and becomes `standard`; nothing is deferred, dropped, or re-ranked.
   - Pass the resulting treatment explicitly into `ExploreCard`. Keep lead sizing separate from treatment so a qualifying standard-position card gains on-photo copy without becoming taller, while pair cards remain standard.
   - Preserve the existing round-line treatment, consequence copy, RPC order, cache keys, analytics, routes, and taps.

2. **One shared video card, two contexts**
   - Add the explicit prop `context="all" | "watch"` to the existing shared `VideoCard`, defaulting to `watch` so every current Watch caller remains full-bleed.
   - Pass `context="all"` from both All long-form placements: the Videos rail and ranked stream cards.
   - In All, apply the shared 12px page inset, 14px radius, and neighbour-matching photo-to-text spacing. Do not fork the component or change playback, poster, duration, title, creator, or Watch geometry.

3. **Scores order and repeating cadence**
   - Keep `Your circle` once at the fixed top of Scores; remove `This week` and `Golfers at` from that fixed block.
   - After 3 feed cards, rotate one rail every 4 further cards in this order: `This week at {club}` → `Where you stand` → `Around {county}` → `Golfers at {club}` → restart at `This week`.
   - Never include `Your circle` in the repeating rotation.
   - Consume an empty rail's scheduled slot without pulling the next rail upward, preserving feed separation and preventing adjacent rails.
   - Keep All's existing order because it already alternates faster-changing media/weekly rails with slower rails. Fix its stale documented behavior so that its existing sequence actually repeats after the last entry instead of stopping.

4. **Verification and report**
   - Add focused tests for hero eligibility/demotion, first-card hero, one-in-four enforcement, repeating rail order, one-time circle placement, and empty-slot cadence.
   - Run focused tests, project build/type checks, locale validation if touched, and diff checks.
   - Measure horizontal overflow at 320px and 390px and verify a feed card appears within the first 1.5 Scores screens.
   - On authenticated real data, report hero/standard counts and whether the cap bound. If authenticated data remains unavailable, report that limit rather than inventing a mix.
   - Report the final Scores sequence, unchanged All sequence with repaired repetition, `VideoCard` prop name, Watch preservation, and contradictions.

## Findings that affect the build
- The current Scores source contradicts the brief by stacking `Your circle`, `This week`, and `Golfers at` before any feed card.
- Current comments claim shelf rotation wraps, but the implementation stops permanently after one pass. This rebuild will make the documented repeat real.
- All's order itself already follows the change-frequency principle, so only its missing repeat changes.
- `record_lost` is included because the brief explicitly names it as a real consequence, even though it is negative news; the brief wins.
