# Video engine rollback (BRIEF_FEED_VIDEO_BUDGET)

Applies to the current lane-based `VideoEngine` (`src/video/VideoEngine.ts`).
Each change below is independent — roll back only the one that regressed.
Line numbers are as of the brief landing.

## 1 — Feed lanes capped to the card
Symptom: inline feed video looks soft / under-resolved.
- `src/video/lanePolicy.ts:99-101` — `FEED_HLS_OVERRIDES`: set to `{}` (removes `capLevelToPlayerSize` from feed-active/next/prev).
- `src/video/VideoEngine.ts:916` — opening rung: replace
  `lane.id === 'fullscreen' ? viewportPixelHeight() : elementPixelHeight(lane.el)` with `viewportPixelHeight()`.
- Fullscreen lane was never capped; nothing to restore there.

## 2 — Paused neighbours buffer 6s
Symptom: stall on swipe into the next card.
- `src/video/lanePolicy.ts:106` — `FEED_PRELOAD_MAX_BUFFER_S`: restore to `20`
  (equal to `HLS_CONFIG.maxBufferLength` at `lanePolicy.ts:64`). The preload write (`VideoEngine.ts:1041`) and play restore (`VideoEngine.ts:1260`) then become no-ops.

## 3 — Orphan VideoPool prewarm removed
Symptom: swipe in fullscreen opens colder than before (unlikely — the pooled element was never used).
- `src/components/feed/SnapFeed.tsx:463` — after `PrefetchController.request(...)` reinstate
  `if (k === 1) VideoPool.prewarm(hlsUrl, 'inline');`
  and re-add `import { VideoPool } from '@/video/pool/VideoPool';` to the imports.

## 4 — Explore tile settle / grace
- `src/components/explore-tab-new/courseled/reviewVideoAutoplay.ts` — set `AUTOPLAY_SETTLE_MS` and `AUTOPLAY_LOSS_GRACE_MS` to `0` (used by both review and media-rail coordinators).

## 5 — Instrumentation
- `loadingCount` settles via `settleLoading()` in `VideoEngine.ts`; it gates only a debug log, so no rollback is needed.

## Untouched by this brief
Loop / ended / borrow handling, carousel smoothness, rail lane config, the 90s fullscreen back buffer (`lanePolicy.ts` `FULLSCREEN_HLS_OVERRIDES`).
