# WS6 — Creator to follow and Top 100 on film

## Completed
- Creator shelf reads `get_watch_spotlights({ p_limit: 3 })`, cached per viewer/visit with the previous no-refetch rules. Removed the unused singular hook and unused figures helper.
- Independent keyed cards preserve head/profile/video/follow actions, keep follow state per visit+actor, and add one-based positions to existing spotlight events. Swipe events carry `{ to }` (one-based); dot taps initiate scrolling without claiming a swipe.
- Count/newest-loaded-video recency replaces area/count; missing or failed video reads show the count only. Relative bands are calendar-day today/yesterday, days <7, floored weeks <56 days, then full month; singular video/week are grammatical.
- Three-across videos are 150px tall with shared top-right glass duration. No figures boxes remain.
- Scoped snap rail uses 16px gutters/inset, 10px gap, multi-card width `min(340px, calc(100% - 50px))`, single full-width mode, scroll-linked clickable dots.
- Top 100 tiles and new loading skeleton are 156×248/radius12; shared GlassBadge rank top-left and GlassDurationBadge top-right. Frozen shade, course/who labels and taps preserved. DurationChip remains in WatchGridPage unchanged.

## Mock authority / verification limits
- The mock draws 340px cards at 390px phone width, while §3 specifies the responsive `min(340px, 100% - 50px)` rule. Used the explicit responsive rule: real CSS at 390px gives a 308px card, second card starts at334px (peek visible), one-card width358px, scroll padding16px, mandatory x snap. No invented fixed-width exception.
- The mock's avatar aspect and heading spacing differ from the existing build; these are frozen by §2, so retained existing head/avatar and ShelfHeading defaults.
- Real browser isolated geometry fixture confirms 16×6 active and6×6 inactive dots with6px gaps; screenshot inspected at `/tmp/browser/ws6/geometry.png`. This is geometry-only, not real creator content or signed-in readback.
- Signed-in Watch/card/video/follow persistence end-to-end remains unavailable with external_unmanaged authentication. Real query/router component tests cover these entrypoints with fixtures; no claim of hosted follow writes or full visual parity.
- No SQL, migrations, migration files, RPC/edge-function edits, feed_config, guest browsing, review wizard, news, round plots or native/Median configuration changes; round_pool_cap untouched at30.

## Files touched
1. `src/features/explore-magazine/watch/CreatorSpotlight.tsx`
2. `src/features/explore-magazine/watch/useWatchBottom.ts`
3. `src/features/explore-magazine/watch/watchBottom.ts`
4. `src/features/explore-magazine/watch/Top100FilmShelf.tsx`
5. `src/features/explore-magazine/watch/spotlight.css` (new scoped geometry)
6. `src/index.css` (one semantic inactive-dot token)
7. `src/test/ws3WatchBottom.test.tsx`
8. `src/test/rsRoundsShelf.test.tsx` (plural-hook empty mock only; assertions unchanged)
9. `AGENTS.md` (managed ownership pointer)
10. `roadmap.md`
11. `WS6_REPORT.md`
12. Project memory `features/watch/ws6-spotlights` and its index entry.

## Rewritten existing cases (authorized)
No cases deleted. Five cases renamed/rewritten, all in ws3WatchBottom:
1. **“figures with rounds and a handicap: three cells”**: old assertion `expect(spotlightCells(spot())).toEqual([{ key: 'handicap', value: '6.4' }, { key: 'rounds', value: '142' }, { key: 'courses', value: '31' }])` and figures attribute `'3'`; now **“WS6: figures are absent with rounds and a handicap”**, `expect(q('[data-spotlight-figs]')).toBeNull()`. Reason: figures removed for all creators.
2. **“figures with rounds but no visible handicap: two cells”**: old `expect(spotlightCells(spot({ handicap_index: null })).map((c) => c.key)).toEqual(['rounds', 'courses'])`; now **“WS6: figures are absent with rounds and no visible handicap”**, null figures assertion. Reason: same removal.
3. **“figures without rounds: Videos and Courses filmed, filmed hidden at 0”**: old helper expectations `[{ key: 'videos', value: '24' }, { key: 'filmed', value: '11' }]` and `['videos']`; now **“WS6: figures are absent without rounds regardless of courses filmed”**, two cards and no figures box. Reason: same removal, preserves both filmed states.
4. **“area/videos line, area dropped when null, singular video”**: old `expect(spotlightLine({ area: 'Surrey', videos: 38 })).toBe('Surrey · 38 videos')`, null-area24→`'24 videos'`, null-area1→`'1 video'`; now **“WS6: video count alone until newest loaded video is available, singular video”**, counts38/24/1 without area. Reason: new recency line replaces area.
5. **“WS5: still renders DurationChip”**: old `expect(q('[data-top100-tile="t1"] [data-duration]')).not.toBeNull()`; now **“WS6: renders shared glass duration at top-right”**, no DurationChip and a top6/right6 shared badge. Reason: authorized badge replacement.

Two retained case names have changed analytics assertions:
- **“follow → Following → unfollow, the card stays”**: `expect(f.track).toHaveBeenCalledWith('watch_spotlight_follow', { actor_type: 'personal' })` now adds `position: 1`. Reason: §3 event positions.
- **“videos row shows 1–3 tiles and opens the viewer with these videos”**: `expect(f.track).toHaveBeenCalledWith('watch_spotlight_video_opened')` now adds `{ position: 1 }`. Reason: §3 event positions.
Shared mock/export shape changed singular→plural, converting each old single fixture to a local one-element returned array; existing fixture values and all other test assertions unchanged. rsRoundsShelf empty stub is now `useWatchSpotlights: () => ({ data: [], isError: false })`; no case rewritten there.

## New tests and inventory
Baseline from VIDEO_POSTERS_1: **6,005 tests /548 files**.
After: **6,023 passed /548 files**. Delta **+18/+0**, entirely ws3WatchBottom **21→39**; no deletions or count changes elsewhere.
New cases:
1. “three creators render three cards and three dots”
2. “one creator uses full-width mode without dots”
3. “scroll follows the nearest card and emits its one-based position”
4. “dot tap scrolls to its card without a swipe event”
5. “Follow on card two leaves card one unchanged and persists per actor on remount”
6. “creator videos are150 tall with top-right glass duration”
7. “line uses the newest loaded video and stays count-only before videos load”
8–15. Parameterized “relative band at %i days is %s”:0 today,1 yesterday,2 two days,6 six days,7 one week,14 two weeks,55 seven weeks,56 in September (clock2026-11-03).
16. “plural read calls limit three and caches picks within one visit”
17. “Top100 tile uses156×248 geometry and glass rank at top-left”
18. “Top100 skeleton matches tile geometry”

## Exact verification commands
Focused:
`bunx vitest run src/test/ws3WatchBottom.test.tsx src/test/rsRoundsShelf.test.tsx src/test/ws1WatchTop.test.tsx src/test/ws2WatchMiddle.test.tsx --maxWorkers=2`
**140/140 tests,4 files**. Complete `/tmp/ws6-focused.log`.

Full four shards:
- `bunx vitest run --maxWorkers=2 --shard=1/4`:1501 tests/137 files.
- `bunx vitest run --maxWorkers=2 --shard=2/4`:1469 tests/137 files.
- `bunx vitest run --maxWorkers=2 --shard=3/4`:1501 tests/137 files.
- `bunx vitest run --maxWorkers=2 --shard=4/4`:1552 tests/137 files.
Total **6,023 tests/548 files;0 failures,0 unhandled errors**. Full output retained in `/tmp/ws6-shard1.log`–`/tmp/ws6-shard4.log`. No pre-existing failures found; prior React act warnings remain warnings.

Automatic build latest checked **build OK2026-11-03T08:22:12Z** after final CSS-dot geometry edit. Intermediate plural-hook/helper import errors during the unfinished edit cleared before tests; no surviving type/build error. No manual build/typecheck run per environment policy. Full shards ran after implementation/test changes and before the final CSS-only dot geometry correction, whose actual dimensions were verified in Chromium.