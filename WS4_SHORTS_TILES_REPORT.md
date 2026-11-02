# WS4 Shorts tiles — complete

## Implemented
Only four presentation values changed in `WatchFeed.tsx`: QH_W 126→156, QH_H 224→248, shelf title minHeight `calc(12px * 1.3 * 2)`, and Shorts grid title minHeight `calc(12.5px * 1.32 * 2)`. Skeleton uses the same size constants. Grid aspect remains `126 / 224`. No other page behaviour or protected backend/configuration changed.

## Authorised fixture fix (Ben, 21:39 UTC)
In the new `WS4 shelf tiles are 156 wide with a 248 cover-fit poster` case only, `f.clips.data` now supplies a local spread copy of the shared `hub()` fixture with `poster_url: 'https://x/clip1.jpg'`. The shared `hub()` fixture is untouched, so no other case's data changed. With a poster present, the tile renders its image and the cover-fit assertion passes.


New failure, verbatim:
```text
FAIL src/test/ws2WatchMiddle.test.tsx > WS2 order on For you > WS4 shelf tiles are 156 wide with a 248 cover-fit poster
AssertionError: expected undefined to be 'cover' // Object.is equality
Expected: "cover"
Received: undefined
❯ src/test/ws2WatchMiddle.test.tsx:115:59
expect(poster?.querySelector('img')?.style.objectFit).toBe('cover');
```
The existing hub fixture supplies `poster_url: null`, so the tile renders its fallback instead of an image. The width and height assertions passed; the new cover-fit assertion cannot inspect an image in that fixture. No test/component correction was made after the failure, in accordance with the stop rule. No pre-existing failures were observed in this focused run.

Automatic build: **build OK**, 2026-11-02T21:35:56Z. Four full shards and live visual checks were not run after the stop.

## Inventory
Last fully passing baseline: **5,946 tests / 545 files**.
Candidate inventory: **5,950 / 545**, not a full passing total. `ws2WatchMiddle.test.tsx` grows 18→22, adding four cases:
- `WS4 shelf tiles are 156 wide with a 248 cover-fit poster`.
- `WS4 all titles reserve the same two-line space for short and long titles`.
- `WS4 quick titles reserve the same two-line space for short and long titles`.
- `WS4 Shorts grid retains the 126 / 224 aspect and three columns`.
Existing tests unchanged; no tests deleted, renamed or rewritten.

## Files touched
- `src/features/explore-magazine/watch/WatchFeed.tsx`
- `src/test/ws2WatchMiddle.test.tsx`
- `roadmap.md`
- `WS4_SHORTS_TILES_REPORT.md`

No SQL, migrations, deployed RPC/edge-function edits, feed_config changes, round_pool_cap changes, native/Median changes, guest-browsing changes, review-wizard changes, news changes or round-plot changes.