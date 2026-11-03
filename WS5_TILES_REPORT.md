# WS5 — one duration badge, one tile width

Mock `watch-tiles.html` was not attached; built from the brief's explicit values (needs a check against the mock).

## Files
- `src/components/media/GlassDurationBadge.tsx` — opt-in `placement: 'top-right'` (+ `top`, default 6). Default bottom-right unchanged.
- `src/features/explore-magazine/watch/WatchFeed.tsx` — `QH_W`/`QH_H` exported, `SHELF_BADGE` ({ placement 'top-right', top 6, right 6 }); optional Poster `badgeTopRight`, set only on Shorts shelf tiles (grid keeps `badge="solid"`).
- `src/features/explore-magazine/watch/CourseVideosShelf.tsx` — tile and skeleton 156 × 248, radius 12 (literals commented to QH_W/QH_H; importing WatchFeed would be circular); DurationChip replaced by GlassDurationBadge with the same props as the Shorts tile. DurationChip export unchanged.
- `src/features/explore-magazine/watch/RegionsShelf.tsx` — width 150 → 156.
- Tests: `src/test/ws2WatchMiddle.test.tsx`, `src/test/ws3WatchBottom.test.tsx`.

## Authorised existing-test edit (old course badge)
`ws2WatchMiddle` "tile shows the short course name, name · age and the duration":
- before: `expect(tile.querySelector('[data-duration]')!.textContent).toBe('0:26');`
- after: `expect(tile.querySelector('[data-course-badge]')!.textContent).toBe('0:26');`

## New cases (+5)
ws2WatchMiddle (18 → 22): Shorts shelf badge top-right / grid unchanged; default caller bottom-right; course tile 156×248 r12 glass not DurationChip; region tile 156×100.
ws3WatchBottom (20 → 21): Top100FilmShelf still renders DurationChip.

## Suite
`--maxWorkers=2`, 4 shards: 1,501 + 1,475 + 1,534 + 1,459 = **5,969 / 545 files**, 0 failures, 0 unhandled errors. Baseline 5,964 (EXPLORE_TOP_2) → +5 as named. No pre-existing failures. Build OK.
