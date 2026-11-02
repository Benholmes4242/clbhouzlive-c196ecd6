# ACTIVE RING — build report

## Files
- New: `src/features/find-people/activeRingRules.ts` (activityLine), `useRecentActivity.ts` (one batched `get_recent_activity` read; key `['recent-activity', viewerId, sortedIds]`, signed-in + non-empty, 5 min stale, no focus refetch), `ActiveRing.tsx` (`ACTIVE_RING_GRADIENT`, ring/gap/3.5px slot, `ActiveAvatarDoor` avatar button).
- `WhoToFollowRail.tsx`: card 220 → 252; avatar in `ActiveRing surface="card"`; 15px amber when line; ringed avatar opens `/post/{id}` (click and Enter/Space stopped from the card).
- `FindPeoplePage.tsx`: GolferRow/BusinessRow outer `<button>` → `div role="button" tabIndex=0` with Enter/Space; avatar in `ActiveRing surface="canvas"`; reason line `{when} · {reason}`; one `useRecentActivity` call for all rendered group rows (search results out of scope).
- Six locale files: `findPeople.active.*` (English text).
- Supabase types already contained `get_recent_activity`; no change. No SQL, migrations, RPC/edge, feed_config, round_pool_cap or native changes.

## Test changes
- New `src/test/activeRing.test.tsx`: 15 tests.
- `wfFixRail.test.tsx` FIX §1 test: `expect(card.style.height).toBe('220px')` → `'252px'` (brief changes the card height).
- `wf1FindPeople.test.tsx`, three tests (figures/verified, follows a golfer, follows a business): `.closest('button')` → `.closest('[role="button"]')` (brief changes the row from `<button>` to a role="button" div). Assertions otherwise unchanged.
- Note: jsdom drops gradient values from inline style, so the gradient assertion reads `renderToStaticMarkup` output.

## Checks
- `NODE_OPTIONS=--max-old-space-size=6000 npx tsc --noEmit -p tsconfig.app.json`: clean.
- Shards (`--maxWorkers=2`): 1,433 + 1,396 + 1,448 + 1,477 = **5,754/5,754 across 535 files**. Baseline 5,739/534: +15 tests / +1 file = `activeRing.test.tsx`. No failures.
