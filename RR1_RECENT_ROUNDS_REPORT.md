# RR1 — Recent rounds on Explore

Brief: `RR1_Recent_rounds_on_Explore._The_mock_is_pasted-2.md`; mock `recent-rounds-final.html` (signed off). No SQL, no migrations, no RPC/edge-function edits, `feed_config` untouched, `round_pool_cap` still 30, no native/Median changes. Guest browsing, the review wizard, news and round plots untouched.

## Files touched

- `src/features/explore-magazine/watch/RoundsThisWeekShelf.tsx` — one paged read (`useRecentRounds`, `useInfiniteQuery` on `get_recent_rounds(scope, '14', 10, offset)`, `hasNextPage = loaded < total_count`); circle→everyone fallback under two circle rows; feats read and `FeatCard` removed; heading "Recent rounds" with flex-end row and the Leaderboards pill (`rounds_door_tapped { from: 'header' }`); door bar removed (loading state included); rail gains `scrollPaddingInline: 16`; sentinel + IntersectionObserver (`rootMargin 0px 300px 0px 0px`) loads ten more as you swipe, one 232×214 skeleton while fetching, then the 150×214 end tile (`rounds_door_tapped { from: 'end' }`); the line under each card uses `recentSentenceParts` (null = no line).
- `src/features/explore-magazine/watch/roundsShelfRules.ts` — added `recentSentenceParts` (the eight §5 rules, in order, keeping the standout keys/wording for the cases they already covered; par "out of range" = null or outside 60–80), `SHELF_END`, `SHELF_SKELETON`. Removed `eligibleFeats`, `buildShelfCards`, `ShelfCard`, `SHELF_FEAT_ORDER`, `SHELF_FEAT_CAP`, `SHELF_WINDOW_DAYS`, `SHELF_DOOR`, `FEAT_TILE` — nothing else imported them (`rg` confirmed: only the shelf and its test did). `useFeatsWindow` and the /rounds page feats are untouched.
- `public/locales/{en,en-XA,de,es,ja,ko}/courses.json` — `roundsShelf.title` → "Recent rounds" (translated per locale), new `leaderboards` and `endTitle` keys; `en` gains `amateur.standout.firstRound / ordinalRound / aboveAverage / rightOnAverage` (the other locales already fall back to English for `standout`).
- `src/test/rsRoundsShelf.test.tsx` — rewritten shelf cases (below).
- `RR1_RECENT_ROUNDS_REPORT.md`, `roadmap.md`.

## Tests

- Focused: `bunx vitest run src/test/rsRoundsShelf.test.tsx` — 31/31.
- Full suite, `--maxWorkers=2`, four shards, 0 failures, 0 unhandled errors: 1,501 + 1,470 + 1,530 + 1,458 = **5,959 tests / 545 files**. Baseline 5,950/545 (WS4); delta **+9 tests, +0 files**, all in `rsRoundsShelf.test.tsx` (22 → 31).
- Automatic build: `build OK` (latest entry, after the final edits).

### Changed or removed cases (before → after)

Removed (behaviour left the shelf):
- `keeps only feats from the last 14 days with a score id, in rarity order, capped at two` — asserted `eligibleFeats` filtering/order/cap; feats no longer appear in this shelf.
- `orders cards round, round, feat, round, round, feat and closes up missing slots` — asserted `buildShelfCards` interleaving; the carousel is rounds only.
- `feat card: label, rarity wording and the latest-of line, singular included` — asserted the feat card's label/rarity/latest-of text; card removed.

Rewritten:
- `renders the heading, circle sub-line and interleaved cards…` (asserted "Rounds this week" + round/feat interleave) → `renders newest first from get_recent_rounds, with the new heading and circle sub-line` (asserts "Recent rounds", pool order, and the RPC args `{ p_scope: 'circle', p_window: '14', p_limit: 10, p_offset: 0 }`).
- `hides the heading when there are no cards but keeps the door` → `hides the heading when there are no rounds` (door assertion dropped; door bar removed).
- `hides the shelf quietly on error, keeps the door and logs` → `hides the shelf quietly on error and logs`.
- `reserves the heading, two cards and the door while loading` → `reserves the heading and two cards while loading, with no door bar`.
- `taps open the right score id; avatar opens the member; both doors go to /rounds` → split into `taps open the right score id and the avatar opens the member`, `the header pill goes to /rounds and there is no door bar`, and `shows the end tile only when everything is loaded, and it goes to /rounds` (the old case's feat-tap and door-bar assertions are gone with the features).
- `falls back to everyone under two circle rows and says so` — kept, now also asserts the `everyone` RPC call.

New: `loads the next page when the sentinel shows, with a skeleton, and stops at total_count`; `the rail snaps to the 16px inset, not the screen edge`; and the eight pure line-rule cases `(1)`–`(8)`.

## Notes

- The shelf tests now drive the real `useRecentRounds` hook through a spied `supabase.rpc` with a real `QueryClientProvider` and `MemoryRouter`; the sentinel tests install a callback-capturing `IntersectionObserver` (the setup mock is inert).
- Full shard logs: `/tmp/rr1-shard1.log` … `/tmp/rr1-shard4.log` (all clean).
- No pre-existing failures observed. Signed-in visual check against the mock not possible in this sandbox (`external_unmanaged` auth); geometry follows the mock values exactly.
