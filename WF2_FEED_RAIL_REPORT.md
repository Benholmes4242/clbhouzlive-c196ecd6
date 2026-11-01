# WF2 — Who to follow rail in the feed (incl. WF2.1)

Spec: wf2-feed-rail.html. No SQL, migrations, RPC/edge edits, feed_config, round_pool_cap (30) or native/Median changes.

## Diff summary
- `src/features/find-people/railRules.ts` (new): rail card ordering (`your_club` business first, server-ordered golfers, next non-`your_club` business after every three golfers), slot slices 0–9 / 10–19 after session-hidden filtering, <3 cards omits the slot, `railSlotForPostIndex` (posts 3 and 15), shared business-category label (reused by FindPeoplePage), test-only session reset.
- `src/features/find-people/WhoToFollowRail.tsx` (new): header + See all → `/find-people`, follow/unfollow, dismiss → `suggestion_dismissals` (200ms exit, duplicate-key ignored, other errors restore + toast, queries marked stale without refetch), 50%-visibility view analytics.
  - WF2.1: cards row `touchAction: 'pan-x'` → `'pan-x pan-y'`; overscrollBehaviorX `contain`, scroll-snap and hidden scrollbar unchanged; comment updated.
- `CardFeed`: new optional `renderBeforePost?: (postIndex) => ReactNode` prop, rendered before the post at that index without changing item indices or keys; other callers unaffected. Clubhouse feed passes a stable callback rendering rails at posts 3 and 15.
- `SuggestedGolfersBlock.tsx` (Activity): uses `usePeopleSuggestions` + `golferReason`/`golferFigures`; See all mute.
  - WF2.1: `reasonIsAmber` import and use removed; every reason line is `A.DIM`.
- `SuggestedGolferRow.tsx`, `PeopleShelf` untouched. The `SuggestedGolferRow` component is still imported by `NobodySawThatRound.tsx`; `reasonText` by PeopleShelf, WelcomeGolfers and SuggestedGolfersRail. `reasonIsAmber` now has no importer.
- Six locale catalogues: rail keys.

## Tests (src/test/wf2FeedRail.test.tsx)
- WF2: 28 new tests (harness fixes during WF2 only touched new cases: uninterpolated i18n defaults, three-card slot minimum, observer-entry `as unknown as` casts).
- WF2.1 added (none deleted/renamed/rewritten):
  - `cards row allows vertical feed scroll (touch-action includes pan-y)` — `expect(row.style.touchAction).toContain('pan-y')`, plus pan-x and `overscrollBehaviorX === 'contain'`.
  - `no reason line is amber, including club and reciprocal` — club/reciprocal reason colours `not.toBe('rgb(247, 147, 30)')` / `#f7931e`.
- File: 28 → 30.

## Results
- `npx tsgo --noEmit`: clean, exit 0.
- `vite build`: clean, exit 0 (chunk-size warning only, pre-existing).
- Full suite, 4 shards: 5,643/5,643 across 528 files, zero failures (WF2: 5,641/528 → WF2.1 +2 tests, +0 files). No pre-existing failures.
- Not verified: signed-in touch scrolling on a real device.
