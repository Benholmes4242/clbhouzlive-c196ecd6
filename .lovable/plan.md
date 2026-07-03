# Video Teardown to Poster-Only Chassis

Goal: kill all real video playback (hls.js, pools, autoplay, prefetch) while keeping UI, layout, tap-to-open, FLIP, skeletons, LQIP identical. No new engine yet.

Contract: every video surface renders its existing UI with a poster `<img>` where `<video>` used to be. All engine imports still resolve (stubbed), so nothing compiles-out.

## Stage A - Neutralize the core (engine goes inert, all imports resolve)

Stubbed in place (keep file paths, exports, types, method names; bodies become no-ops / inert defaults):

- `src/media/runtime/*` - `MediaSystemProvider` returns inert context (no hls, `isPlaying:false`, no refs, no-op setters). `MediaRuntime` singleton methods become no-ops; subscribe returns `() => {}`.
- `src/media/hooks/useHlsPool.ts` + `HLSPoolManager` - `attach/promote/demote/handOff/prefetch/release` all return `null`/`false`.
- `src/media/hooks/useMediaAutoplay.ts`, `useTileVideoPlayer`, `usePausedFirstFrame`, `useVideoVisibility` - return inert shape (never active, no ref wired).
- Add one boot log: `console.info('[VIDEOSTUB] active')` from `MediaSystemProvider` mount so we can confirm on device.

Result: nothing plays; app still compiles and runs.

## Stage B - Sever surfaces to poster-only (leaf-first, compile-safe)

For every surface below: keep the file, the exported component name, the props, the outer layout, the reveal/LQIP/skeleton, and tap-to-open. Replace the `<video>` branch with an `<img>` bound to the existing poster / thumbnail URL. Where the poster URL is missing, wire it before removing the video branch so nothing goes blank.

- **B1 Grids**: `UnifiedMediaTile`, `UnifiedMediaGrid`, `grid/MediaTile`, `HeroTile`, `UniversalMediaGrid`, `useGridMediaRuntime`, `media-grid/MediaDisplay`, `posts/MediaGrid`.
- **B2 Autoplay wrappers**: `WatchAutoplay`, `ExploreAutoplay`, `FriendsAutoplay`, `CourseMediaAutoplay`, `AutoplayVideoCard`, `CarouselRow`, `WatchOfTheWeekHero`, `WatchRailTile`.
- **B3 Feed**: `InlineVideo` gutted to a poster `<img>` (file + export preserved). `MediaCarousel` always passes `renderPosterOnly=true`. `CardFeed`, `FeedCard`, `LightFeedCard`, `FeedSlide`, `SnapFeed` keep card UI, drop video slot wiring.
- **B4 Fullscreen**: `SnapVideoPlayer` poster-only. `FullscreenFeedOverlay` keeps FLIP expand, layout, chrome; the "player" is a poster. `openWithOrigin` keeps snapshot, drops `handOff`.
- **B5 Profile / course / misc**: `profile-v2/HeroMedia`, `MomentCard`, `MomentFullscreenViewer`, `AboutMediaStrip`, `MiniPlayer`, `MediaPreviewViewer`, `KeyframePlayer`, `VideoScrubber` (UI only), `messaging/MediaMessage`.

## Stage C - Sever side-systems

- `useWatchProgressTracker` -> no-op.
- `globalVideoMute`, `pauseAllAudio` -> keep exported API as no-op.
- `AppPrefetch` video hooks, `hlsPoolPreloader`, `prefetchTile` -> drop video prefetch, keep image/poster prefetch.
- `blobUrlManager`, `useHlsUrlCache`, `safePlay`, `sharedBandwidth`, `videoReadyFlags` -> left as unused stubs (deleted in Stage E).
- `PostDeepLinkPage` deep-link autoplay -> opens poster, no autoplay.

## Stage D - Verification gate (must pass before any deletes)

- App builds, runs, no white screens on: Clubhouse feed, fullscreen open/close, Watch (rails + grid), clips subpage, videos subpage, course media tab, profile posts (personal + business), explore, friends, messaging media, deep links.
- Every video surface shows a poster - never blank, never black, never a broken element.
- No console errors from missing providers / singletons.
- Grep proof: zero live `new Hls(`, zero live `.attachMedia(`, zero real work in `HLSPoolManager.*`.
- `[VIDEOSTUB] active` present in console on boot.
- Tap-to-open, reveal, skeleton, LQIP, FLIP visual, haptics, double-tap-like still work.

## Stage E - Final delete sweep (only after D)

Delete: `HLSPoolManager`, `useHlsPool`, `MediaRuntime` internals, `UnifiedVideoPlayer`, `HLSPlayer`, `usePausedFirstFrame`, `useTileVideoPlayer`, `hlsLoader`, `hlsPoolPreloader`, `safePlay`, `sharedBandwidth`, `videoReadyFlags`, `videoIdUtils`, `mobileVideoDebug` handoff bits, and the Stage-A stubs themselves. Re-grep to prove zero survivors. Remove `hls.js` from `package.json`.

## Non-goals in this brief

- No new VideoEngine. No autoplay behavior. No unmute UX. No resume-at-position. Those come in the rebuild plan.
- Tier-3 image-only files are not touched.

## Execution note

This is a large multi-turn demolition (~40 files edited in Stage A+B alone, plus verification). I will execute one stage per turn, stopping after each for you to spot-check the preview before moving to the next. Stage A first: engine goes inert, app still runs, nothing plays. Confirm and I proceed to B1.

