# Brief 42 — The video page (Explore › For you) redesign

## Files added
- `src/components/topTen/TenMediaCard.tsx` — sibling of TenRailCard sharing clbhouz-ten.css; any media and any text lines. TenRailCard untouched.
- `src/features/explore-magazine/watch/WatchFeaturedRail.tsx` — Featured rail, slot (guest/thin/error → WatchLead, `watch_featured_fallback` kept), skeleton (two chart cards + five ticks).
- `src/features/explore-magazine/watch/forYouRules.ts` — featured reason precedence, coach ordering/merge, Long form / Following / Most liked cuts and the one-appearance rule.
- `src/features/explore-magazine/watch/useWatchCoaching.ts` — get_watch_pros(12) then get_creator_videos('personal', id, 24) per coach.
- `src/features/explore-magazine/watch/forYouParts.tsx` — canonical heading, rails, tiles, 16:9 cards, coach cards, Follow, Coaching/Long form skeletons.
- `src/features/explore-magazine/watch/watch-for-you.css`.
- `src/test/brief42WatchForYou.test.tsx` — 17 tests.

## Files changed
- `WatchFeed.tsx` — For you rebuilt in the order 1–10 + end button; Coaching chip view; woven rails removed; no pagination on For you; insets 16.
- `watchFilters.ts` — `coaching` chip between Long form and Community; `mapWatchFilter` accepts it.
- `CreatorSpotlight.tsx` — drops verified teaching pros (pro read) and Coaching's coaches.
- `CourseVideosShelf.tsx` — `ShelfHeading` is the canonical heading (22/16/12 padding, See all 13/600 rgba(248,250,252,.55) baseline-aligned on the title row). Also used by Shorts, Creators, Filmed at and the Long form/Shorts chip views.
- `useWatchBottom.ts`, `watchBottom.ts`, `watchMiddle.ts` — removed Top 100/By region-only code.

## Removed
- `RegionsShelf.tsx`, `Top100FilmShelf.tsx`; `useTop100Videos`; `Top100VideoRow`, `TOP100_SHELF_LIMIT`, `TOP100_MIN`, `showsTop100Shelf`, `rankPill`; `REGIONS_MIN`, `showsRegionsShelf`.
- Kept (still used): `useWatchRegions`, `regionPath`, the `/watch/region` and `/watch/top100` grid pages. `/watch/top100` now has no entry point in the app; awaiting a ruling.
- Kept, now unused by the app: `WatchFeaturedDeck.tsx` / `featured.css` (the brief only removes it from For you; its own tests still run). Delete on request.

## Decisions to note
- Following "See all": no list sheet or chip exists for it, so it opens the fullscreen viewer on the whole list (the existing viewer).
- Most liked has no See all (none in the brief or mock).
- Continue watching gets the canonical heading (eyebrow "Pick up where you left off").
- Coaching chip while searching falls back to the normal search results, like Community.

## Tests — before 10,777 / 943 files (Brief 41), after 10,771 / 944 (2,581 + 2,585 + 2,704 + 2,901), zero failures
Delta −6 tests, +1 file = +17 new − 23 deleted.

Deleted (behaviour removed by the brief):
- `er3LongFormRails.test.tsx` (10, woven rails in the endless list): "40 long videos weave…", "no short or grouped member repeats…", "fewer than three unseen shorts…", "fewer than three community members…", "More shorts See all…", "community See all selects Community in place…", "takes one extra clips page…", "an insufficient one-page refill…", "community keeps the 72 candidate read…", "opens a later short at its correct index…". Its 3 other tests remain.
- `ws2WatchMiddle.test.tsx` (5): "lead → Shorts → Filmed at your courses → By region → Long form" (old order); By region: "is hidden under three regions", "shows no Your patch…", "a tap routes to the encoded region"; "the region tile is 156 wide and 100 tall".
- `ws3WatchBottom.test.tsx` (7): "By region → Creators to follow → Top 100 on film → Long form → the community rail" (old order); Top 100 shelf: "WS6: renders shared glass duration at top-right", "hidden under three rows and on error", "rank pill reads…", "See all → /watch/top100; a tile opens the viewer…", "Top 100 tile uses 156×248 geometry…", "Top 100 skeleton matches tile geometry". The two `/watch/top100` grid-page tests were kept.
- `exploreShelfHeadCanon.test.tsx` (1): "Top 100: eyebrow top100.title, title top100.sub".
- Mock lines for the deleted modules removed from `er1ExploreCommunity`, `er3`, `ws3`, `exploreShelfHeadCanon`.

Rewritten (assertion old → new):
- `ws1WatchTop` "reads For you · Shorts · Long form · Community" and "a linked community entry…": tab list `[For you, Shorts, Long form, Community]` → `[…, Coaching, Community]`; `tabs[3]` → `tabs[4]`.
- `ws1WatchTop` "maps the old values": `WATCH_CHIPS` `['all','quick','long','community']` → `[…,'coaching','community']`.
- `ws1WatchTop` "search opens with Cancel…": `toHaveLength(4)` → `toHaveLength(5)`.
- `ws1WatchTop` "the community rail's See all…": `heading.closest('div')` → `heading.closest('[data-fy-head]')` (canonical heading).
- `ws3WatchBottom` helper `headingByText` also matches `[data-fy-eyebrow]`; "Long form's See all…": `closest('div').parentElement` → `closest('[data-fy-head]')`; "course chip only when…": now mounts `initialFilter="long"` (the For you rail has no course chip; the Long form chip list keeps it).
- Brief test 9: Courses chart and profile Top 10 tests unchanged and passing.

## Screenshots (test data; sign-in unavailable on this backend)
A temporary harness page rendered the real `WatchFeed` with intercepted reads (catalogue course photos as posters, invented names/titles); it was removed afterwards. The harness has no page chrome above the feed, so the sticky chips overlap the first heading in the top captures — that's the harness, not the app.
`390_top`, `390_coaching`, `390_middle`, `390_middle2`, `390_end`, `320_top`, `375_top`, `320_coaching`, `390_coaching_chip`.
Measured: featured cards 264×322 (390), 253×308 (375), 213×259 (320); no horizontal overflow at any width. The community rail is not in the captures (its read comes from posts, which the harness returned empty); it's covered by the jsdom order test.

## Not verified
Live data, real autoplay of the snapped card, Follow on a coach card in a signed-in session, get_watch_pros against Ben's live function.

No SQL, no migrations, `feed_config` untouched, `round_pool_cap` 30, no security "Fix all".
