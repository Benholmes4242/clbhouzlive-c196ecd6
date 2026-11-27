# Brief 46 — Video page: Clubs and brands

## Files
- New `watch/useWatchBusinesses.ts` — `get_watch_businesses(12)`, then `get_creator_videos('business', id, 24)` each; list error ⇒ section absent; per-business error ⇒ no videos.
- New `watch/forYouBusiness.tsx` — BusinessCard (coach card, 46×46 radius-12 logo with initials fallback, name + `VerifiedBadge sm`, "category · place", count/"24+", business Follow), BusinessCards, BusinessesSkeleton, BusinessTick. Separate from forYouParts so the `oneMarkPerMember` guard holds (business ticks never share a file with member names).
- `watch/forYouRules.ts` — added `WatchBusinessRow`, `businessLine`, `orderBusinesses`, `BUSINESS_*`; `forYouCuts` takes `businesses` after Following, min 3.
- `watch/forYouParts.tsx` — FyTile `tick` prop; FollowPill takes `actorType`; `FollowPill`/`Box` exported.
- `watch/WatchFeed.tsx` — section 9 replaced; See all opens the viewer on the whole merged list.
- `watch/watch-for-you.css` — logo/tick rules.

## Removed
- Rules: `MOST_LIKED_MAX`, `MOST_LIKED_MIN`, the most-liked cut in `forYouCuts`, the `mostLiked` cut.
- Test deleted: `brief42WatchForYou` "Most liked hides with fewer than three, orders by likes then newest" (only covered the removed rule).
- Tests updated (rule changed by this brief): `brief42WatchForYou` "renders the ten sections in order…" — position 9 `[data-fy-section="liked"]` → `[data-fy-section="businesses"]` (seeded with one business, three videos) plus no "This month's most liked"; "no post appears twice…" — rail list `'liked'` → `'businesses'`.

## New tests
`src/test/brief46ClubsBrands.test.tsx` — 5 tests (brief tests 1–5), all passing.

## Totals (both briefs, four sequential shards)
2,583 + 2,563 + 2,705 + 2,904 = **10,755 tests / 948 files**, zero failures. Baseline Brief 44A 10,745/946. Delta +10/+2 = +6 (brief45 file) +5 (brief46 file) −1 (deleted Most liked test).
Shard 4 first had one failure: `oneMarkPerMember` guard flagged `forYouParts.tsx` (VerifiedBadge beside InlineProMemberName). Fixed in source by moving business parts to `forYouBusiness.tsx`; test untouched; shard 4 rerun 2,904 passed. Shards 1–3 not rerun after that move (it touched only Watch files, whose tests pass).

## Screenshots (test data, harness removed)
`390_clubs_brands.png`, `375_…`, `320_…`. Cards 236 wide, names ellipsise, no overflow. Harness was signed out, so Follow is not visible (tested in jsdom). Found and fixed during capture: the logo fallback spilled over the card until the logo got `position:relative`.

No SQL, no migrations, feed_config untouched, round_pool_cap 30, no security "Fix all".
