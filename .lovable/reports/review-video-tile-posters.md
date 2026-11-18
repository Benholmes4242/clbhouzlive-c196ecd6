# Review video tile posters — complete

## Implemented
- `useReviewMedia.ts` selects `stream_id`, exposes required `streamId: string | null`, and maps `m.stream_id ?? null`. The payload remains an array of JSON-safe objects.
- Review sheet video tiles derive posters through `holeMediaPoster`; the same derived poster is handed to `openWithOrigin`. An empty or unsafe poster means no image, retaining the fill/play glyph. Photo sources and transformations are unchanged.
- Latest reviews small video tiles, video-cover ambient and opening poster use canonical derivation; absent posters suppress images/ambient rather than using playback addresses. The big video's existing player is unchanged.
- The canonical helper can return an unrecognised non-Stream `media_url` unchanged (via `streamPosterFrom`); local callers reject a returned value equal to the playback URL. The shared helper and sibling consumers were not changed.
- No SQL, migrations, new RPCs, feed_config or round_pool_cap changes. The future review-card redesign is not implemented.

## Tests and inventory
Before: **9,071 passing tests**. After: **9,076 passing tests** (+5), all from the new `src/test/reviewVideoTilePosters.test.tsx`. No existing test was deleted, renamed or rewritten.

Added cases:
1. `fetchReviewMedia selects and maps stream_id with JSON-safe null fallback`: exact select includes `stream_id`; mapped identities `[stream, null]`; JSON round trip preserves rows.
2. `sheet video uses a Stream thumbnail and carries it into viewer opening`: thumbnail source equals the supplied Stream identity's `/thumbnails/thumbnail.jpg`; no image source is `media_url`; opening poster matches.
3. `sheet video without a derivable poster has no image and no playback opening poster`: no image, retained play glyph, opening poster null.
4. `Latest reviews small video tile derives the Stream thumbnail and viewer poster`: matching thumbnail/opening poster; never a playback image; photo source unchanged.
5. `Latest reviews unknown video has no small image, unsafe ambient or opening poster`: no small image, retained video badge, null opening poster, absent unsafe ambient.

### Test fixture correction
The earlier stop was a defect in this brief's newly authored avatar mock, not an existing test: `reviewVideoTilePosters.test.tsx:20` returned only `SquircleAvatar`, while `ReviewBottomSheet.tsx:584` also imports `DARK_HAIRLINE`. The mock now preserves the real module exports and overrides only the component. No assertion was added, removed or changed.

## Verification
- Focused command: `npx vitest run src/test/reviewVideoTilePosters.test.tsx src/test/latestReviewMediaTaps.test.tsx src/test/reviewSheetCalibration.test.tsx --maxWorkers=2` — **24/24 passed** across three files.
- Typecheck: `npx tsgo -b --noEmit` — clean.
- Four sequential shards, never parallel:
  - `npx vitest run --maxWorkers=2 --shard=1/4` — **2,238/2,238**
  - `npx vitest run --maxWorkers=2 --shard=2/4` — **2,246/2,246**
  - `npx vitest run --maxWorkers=2 --shard=3/4` — **2,276/2,276**
  - `npx vitest run --maxWorkers=2 --shard=4/4` — **2,316/2,316**
- Full suite: **9,076/9,076**, reconciling exactly as 9,071 + five new cases.
- Latest preview harness: **2026-11-18T13:05:41Z — build OK**.

## Notes and limits
- Ben ruled that the review sheet's existing explicit font declaration remains unchanged for this fix; it is settled by the separate review-card redesign brief that rebuilds `ReviewBottomSheet`.
- Ben's Dundonald Links iPhone still-frame and viewer playback checks remain outstanding.
- Logs: `/tmp/review-video-posters/focused.log` and `/tmp/review-video-posters/shard-1.log` through `shard-4.log`.
