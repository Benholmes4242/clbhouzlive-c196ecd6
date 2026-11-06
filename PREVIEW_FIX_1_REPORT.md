# PREVIEW_FIX_1 — composer Preview video playback — implemented

## Delivered
- **FIX 1 — `buildDraftFeedPost` (src/features/post-v2/components/golf/PostPreview.tsx):** a video with a `streamId` (edit mode) now maps to `{ hlsUrl: generateStreamHlsUrl(m.streamId), thumbnailUrl }` with no `mp4Url`, so the real engine plays it exactly as in the feed. A new local video maps to `{ mp4Url: m.previewUrl }` (the blob) with no `hlsUrl`. Images unchanged.
- **FIX 2 — real dimensions for local videos (PostPreview.tsx):** new `useProbedVideoDims` hook probes each blob video with a detached `<video preload="metadata" muted playsInline>` and frames the card at the true aspect. The FeedCard renders once every probe resolves, or after 1500ms at most with the 1080×1350 fallback for any still unknown. Probes are released on close; composer state is never written.
- **FIX 3 — InlineVideo local-blob branch (src/components/feed/InlineVideo.tsx):** `InlineVideo` is now a thin wrapper: an item with no `hlsUrl` and a `blob:` `mp4Url` renders `LocalBlobVideo` — a plain native `<video>` (absolute inset 0, 100%×100%, caller's objectFit, muted, playsInline, loop, preload="auto", autoPlay, poster from thumbnailUrl). It plays when `isActive` and pauses when false, fires `onFirstFrameReady` on the first `loadeddata`, and never touches VideoEngine (no lane registration, load, preload, ownerKey handoff or spinner). The existing engine path is byte-identical as `InlineVideoEngine`; feed/profile/Explore/fullscreen cannot reach the branch (feedMapper never produces mp4Url, the server never produces blob URLs). `activityPostMapper`'s mp4Url case untouched.

## Not changed (per brief)
FeedCard.tsx, MediaCarousel.tsx, VideoEngine, SnapVideoPlayer, the fullscreen viewer, the composer upload/submit path, blob URL creation/revocation in useStageComposer. No guest browsing, review wizard, news or round plots touched. No SQL/migrations/RPC/edge/feed_config/native changes; round_pool_cap stays 30.

## Tests
New file `src/test/previewFix1.test.tsx` — 10 tests, all passing:
- InlineVideo: blob mp4Url renders native `<video>` with the blob src, never calls VideoEngine.load or useVideoLane; isActive false pauses; onFirstFrameReady fires once; hlsUrl item takes the engine path unchanged.
- buildDraftFeedPost: streamId → hlsUrl via generateStreamHlsUrl, no mp4Url; blob → mp4Url, no hlsUrl; image unchanged.
- PostPreview: metadata 1080×1920 → card framed at 9:16; no metadata within 1500ms → 1080×1350 fallback; photo-only draft renders immediately.

One self-caused failure during development (hardcoded stream domain in my own new test) was fixed by asserting against `generateStreamHlsUrl` output; no existing test was touched. A later type-only cast fix (`as unknown as Record<string, unknown>`) in the same new file cleared six TS2352 build errors; no assertion changes.

## Suite
Focused: 10/10. Four shards (`--maxWorkers=2`, each its own command):
- Shard 1: 1,872 passed (158 files)
- Shard 2: 1,736 passed (158)
- Shard 3: 1,829 passed + 3 failed (159) — the three known FS_NOTCH failures only: `fsNotch1.test.tsx` "renders the scrim inside a top-0 portrait slide"; `fullscreenBand.test.ts` "height-limits taller portraits…" and "anchors synthetic portrait media…".
- Shard 4: 1,758 passed (156)

Total 7,195 passed + 3 known failures = 7,198 tests / 634 files (was 7,188/632; +10 tests, +1 file from the new test file, +1 file count from shard boundaries). No new failures. `src/test/tourIsland.test.tsx:235` (TourGlance width, named as known pre-existing) did NOT fail in this run. Preview build log 2026-11-06T06:18:04Z: `build OK`.

## Manual checks 1–7: NOT VERIFIED
The composer requires a signed-in member and this project's auth is externally managed (`external_unmanaged`), so no browser session can be minted or injected; `/profile/:username` and the composer redirect to `/auth`. The seven manual checks (portrait video plays muted/looping at real aspect; carousel plays visible video only; edit-mode Preview plays through the engine; photo-only Preview unchanged; Back leaves composer intact and Post still publishes; Clubhouse/profile grid/fullscreen unchanged; 320px no overflow) need a signed-in pass on a real device.
