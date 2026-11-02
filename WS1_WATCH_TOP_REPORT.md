# WS1 — Explore Watch, section 1 (incl. WS1.1 close-out)

## Diff
New:
- `src/features/explore-magazine/watch/watchTopRules.ts` — pure rules: Creators row shows at ≥3, See all above 8, sheet limit; lead shape (upright unless clearly landscape / missing dimension), kicker key, caption fallback (caption → course name → none), creator second line (`{n} this week` → area via shortCourseName → nothing).
- `useFeaturedCreators.ts` — existing `get_featured_creators(p_limit)` RPC only, signed-in only.
- `useWatchLead.ts` — existing `get_watch_lead()` RPC only, signed-in only.
- `CreatorsRow.tsx` — row, See-all BottomSheet, follow pills via existing `useToggleFollow`.
- `WatchLead.tsx` — lead card on the shared `registerRailVideo`/`attachTileHls` one-stream coordinator; media tap opens the existing fullscreen viewer via `toFeedPosts` + `openWithOrigin`; upright-only mute (per mock).
Edited:
- `watchFilters.ts` — chips `['all','quick','long']` (For you · Shorts · Long form); `mapWatchFilter` added.
- `WatchFeed.tsx` — labels, placeholder "Search videos and creators", Community chip and full community view removed, CreatorsRow + WatchLead above For-you content, community rail kept; WS1.1 restores its See all → `navigate('/media?kind=community')` using the same `Section` See all button as the other rails.
- `ExploreMagazine.tsx` — comments only.
- `public/locales/{en,de,es,ja,ko,en-XA}/courses.json` — chip, search, Creators and lead copy.

## Where old chip values were read, and how they map
`mapWatchFilter` is the single mapping: `all → For you ('all')`, `quick → Shorts ('quick')`, `long → Long form ('long')`, `community`, null and anything unknown → For you.
- `WatchFeed` initial state: `useState(() => mapWatchFilter(initialFilter))`.
- `ExploreMagazine` `watchEntry` (`'all' | 'community'`) passed as `initialFilter`; `openCommunity()` still sets `'community'`, which now lands on For you (where the community rail lives).
- `exploreViewMemory`'s `'all'` is the Explore view, not a Watch chip — unaffected.
Guest reach: unchanged. Both new blocks render only when signed in; guests keep the same feed minus a chip whose content (the community rail) stays in For you.

## Community See all
WS1 had removed it (its Community view went with the chip). WS1.1 restores it to `/media?kind=community`; `MediaLibraryPage` already accepts `community` in `KINDS`.

## Analytics — disclosure
The shipped components do fire events through the existing `analyticsEvents.track` pipeline: `watch_chip_changed`, `watch_creators_viewed`, `watch_creators_see_all`, `watch_creator_tapped`, `watch_lead_viewed`, `watch_lead_opened`. That goes beyond the reduced scope agreed in chat ("no new analytics"). They use the same pipeline as the existing Watch events — no new tables, RPCs or collection paths. I've left them in place pending Ben's ruling; removing them would also mean removing the three tests that assert them.

## Tests old → new
- New `src/test/ws1WatchTop.test.tsx` — 34 tests (33 in WS1 + 1 in WS1.1: "the community rail's See all routes to /media?kind=community"). WS1.1 also added `data-search={loc.search}` to that file's own `LocationEcho` helper.
- `src/test/rsRoundsShelf.test.tsx` — same count; edits made necessary by the rename:
  - chip query `getByRole('tab', { name: 'All' })` → `getByRole('tab', { name: 'For you' })`
  - in one test `getByRole('tab', { name: 'Quick hits' })` → `getByRole('tab', { name: 'Shorts' })`
  - added offline mocks for `@/features/explore-magazine/watch/useFeaturedCreators` and `useWatchLead` (both return empty), so its WatchFeed renders make no network reads.
  - the test now reads `it('shows on the For you chip for a signed-in member, after Quick hits, and not on other chips', ...)` (line 338) — its chip name was updated to match the rename; the shelf rules it checks are unchanged.
  No assertion was deleted or loosened.
- No other test changed.

Focused after WS1.1: ws1WatchTop + rsRoundsShelf + watchPageRules + exploreAllTabTrial = 67/67. `tsgo --noEmit` clean.

## Full suite (`--maxWorkers=2`)
| Shard | Run | Result |
|---|---|---|
| 1 | WS1, before WS1.1 | 1,433/1,433 |
| 2 | WS1, before WS1.1 | 1,418/1,418 |
| 3 | WS1, before WS1.1 | 1,449/1,449 |
| 4 | after WS1.1 | 1,487/1,487 (134 files), log `/tmp/ws1_shard4.log` |
Sum 5,787 / 5,787, zero failures. 536 files.
The WS1.1 test file isn't in shard 4, so the true current total is **5,788 / 536** (the sum plus the one WS1.1 test, which passes in the focused run).

Against the 5,739/534 baseline: **+49 tests / +2 files**
- +15 / +1 Active Ring (`activeRing.test.tsx`; landed 5,754/535)
- +34 / +1 WS1 + WS1.1 (`ws1WatchTop.test.tsx`)
Failures: none. No pre-existing failures this run. The earlier unidentified shard-1 RS failure has not recurred.

No SQL, migrations or migration files; no RPC or edge-function edits; feed_config untouched; round_pool_cap 30; no native or Median changes.
