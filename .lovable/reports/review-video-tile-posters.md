# Review video tile posters — verification stopped

## Implemented
- `useReviewMedia.ts` selects `stream_id`, exposes required `streamId: string | null`, and maps `m.stream_id ?? null`. Payload remains an array of JSON-safe objects.
- Review sheet video tiles derive posters through `holeMediaPoster`; the same derived poster is handed to `openWithOrigin`. Empty/unsafe poster means no image, retaining fill/play glyph. Photo sources and transformations are unchanged.
- Latest reviews small video tiles, video-cover ambient and opening poster use canonical derivation; absent posters suppress images/ambient rather than using playback addresses. Big video's existing player is unchanged.
- Canonical helper currently returns an unrecognised non-Stream `media_url` unchanged (via `streamPosterFrom`); local callers reject a returned value equal to the playback URL. The shared helper and sibling consumers were not changed.
- No SQL, migrations, new RPCs, feed_config or round_pool_cap changes. The future redesign is not implemented; current surfaces now carry this poster rule.

## Tests and inventory
Before: **9,071 passing tests**. Expected after: **9,076** (five new cases); **not a verified passing full-suite total**. No existing test deleted, renamed, rewritten or changed.

Added `src/test/reviewVideoTilePosters.test.tsx`:
1. `fetchReviewMedia selects and maps stream_id with JSON-safe null fallback`: exact select includes stream_id; mapped identities `[stream, null]`; JSON round trip preserves rows. Passed.
2. `sheet video uses a Stream thumbnail and carries it into viewer opening`: thumbnail source equals the supplied Stream identity's `/thumbnails/thumbnail.jpg`; no image source is media_url; opening poster matches. Failed before assertions due to avatar mock below.
3. `sheet video without a derivable poster has no image and no playback opening poster`: no image, retained play glyph, opening poster null. Failed before assertions due to avatar mock below.
4. `Latest reviews small video tile derives the Stream thumbnail and viewer poster`: matching thumbnail/opening poster; never playback image; photo source unchanged. Passed.
5. `Latest reviews unknown video has no small image, unsafe ambient or opening poster`: no small image, retained video badge, null opening poster, absent unsafe ambient. Passed.

Command: `npx vitest run src/test/reviewVideoTilePosters.test.tsx src/test/latestReviewMediaTaps.test.tsx src/test/reviewSheetCalibration.test.tsx --maxWorkers=2`.
Result: **24 executed / 22 passed / two failed**, three files (two passed, one failed). New file: three passed / two failed of five. Existing files passed 3/3 and 16/16.

## STOP — new test fixture omitted a required export
Mock declaration: `src/test/reviewVideoTilePosters.test.tsx:20`.
Failure site: `src/components/posts/ReviewBottomSheet.tsx:584:138`.
```text
FAIL src/test/reviewVideoTilePosters.test.tsx > review video tile posters > sheet video uses a Stream thumbnail and carries it into viewer opening
FAIL src/test/reviewVideoTilePosters.test.tsx > review video tile posters > sheet video without a derivable poster has no image and no playback opening poster
Error: [vitest] No "DARK_HAIRLINE" export is defined on the "@/components/ui/SquircleAvatar" mock. Did you forget to return it from "vi.mock"?
 ❯ ReviewBottomSheet src/components/posts/ReviewBottomSheet.tsx:584:138
```
The newly authored avatar mock returns only SquircleAvatar, but the sheet also imports DARK_HAIRLINE. Under the stop instruction it was not repaired or rerun; no assertion changed. All four full-suite shards remain **unrun**. Requires authorisation to preserve actual module exports using a partial mock (or remove this mock) before rerunning focused checks and sequential shards.

## Other checks and limits
Latest preview harness **2026-11-18T12:50:39Z — build OK**; `git diff --check` passed. No manual build/typecheck or browser verification run after the stop. Ben's Dundonald Links iPhone still-frame and viewer playback checks remain outstanding.

Existing explicit font declarations in ReviewBottomSheet conflict with the standing system-font rule. Asked which to retain; left them unchanged for this video-only fix pending the answer.

Log: `/tmp/review-video-posters/focused.log`.