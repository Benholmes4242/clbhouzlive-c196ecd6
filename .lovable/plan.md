# Fullscreen Viewer V2 — Phase 1

Clean-room rebuild in an isolated module. V1 stays frozen. Two surfaces get flag-gated dev entry. Parity target is v1 user-visible behaviour, not internals.

## Module layout

```text
src/features/fsv2/
  index.ts                 -- public surface: openFsv2, Fsv2Overlay, FSV2_FLAG
  flag.ts                  -- FLAGS.fsv2 read helper
  tokens.ts                -- literal chrome tokens (glass, ink, backdrop)
  types.ts                 -- OpenOptions (v1-shape, Phase-1 subset live)
  store/
    fsv2Store.ts           -- zustand: open, close, setActiveIndex, setActivePagerIdx
    engagementBridge.ts    -- subscribes engagementBus, patches in-viewer posts
  player/
    fsv2Player.ts          -- one <video>: native HLS (iOS) | hls.js (MSE)
    audioContract.ts       -- session-audio bind + Tap-for-sound fallback
    viewport.ts            -- sane-clamped visualViewport reader + listeners
  overlay/
    Fsv2Overlay.tsx        -- root; body class, shield, status bar, scroll lock
    VerticalSnapPager.tsx  -- scroll-snap-y, ±1 render window
    Slide.tsx              -- one post: image | video | horizontal media pager
    ImageSlot.tsx          -- contain over cover-blur backdrop
    VideoSlot.tsx          -- poster-first, crossfade at first frame
    Chrome.tsx             -- close, mute, caption, author (display-only)
    TapForSoundPill.tsx    -- visual match to v1 canonical
    Watchdogs.ts           -- bounded timers + fsv2.reveal.forced
  perf/
    spans.ts               -- fsv2.open / fsv2.close / fsv2.swipe helpers
    trace.ts               -- fsv2.tap / fsv2.slide / fsv2.reveal(.forced)
```

## Non-negotiables enforced in code

1. **ESLint fence** — add a scoped block in `eslint.config.js`:
   ```js
   { files: ["src/features/fsv2/**/*.{ts,tsx}"],
     rules: { "no-restricted-imports": ["error", { patterns: [
       { group: [
           "@/store/fullscreenFeedStore", "src/store/fullscreenFeedStore",
           "@/components/fullscreen-feed/*", "src/components/fullscreen-feed/*",
           "@/components/feed/FeedSlide*", "src/components/feed/FeedSlide*",
           "@/components/feed/SnapFeed*", "src/components/feed/SnapFeed*",
           "@/lib/openWithOrigin*", "src/lib/openWithOrigin*",
           "@/video/*", "src/video/*"
         ], message: "fsv2 must not import v1 viewer internals." } ] }]
     } }
   ```
   Ship report includes a deliberate forbidden-import lint failure to prove the fence.

2. **Permitted shared imports** (whitelist): `@/integrations/supabase/client`, `@/components/media-system/types/media` (FeedPost/MediaItem), `@/audio/sessionAudioStore`, `@/audio/MuteButton` (TapForSoundPill visual reference only, not re-export), `@/features/chrome-v2/leftOverride` (useSetChromeSuppressed), `@/hooks/useMedianStatusBar`, `@/lib/bodyScrollLock`, `@/lib/routeChrome` (applyRouteChrome), `@/lib/engagementBus`, `@/lib/utils` (cn), `@/perf/vperf`, `@/perf/trace`, `@/perf/navTiming` (isPerfEnabled), `@/config/flags`.

## Store contract

`open(opts)` accepts full v1 `OpenOptions` shape (posts, startIndex, mediaIndex + authoritative mediaId, openCommentsInitially, initialCommentId, onClose, hasNextPage, fetchNextPage, isFetchingNextPage, readOnly, startPosition, openedFrom). Phase 1 uses posts, startIndex, mediaIndex/mediaId, onClose, startPosition, openedFrom. Rest are stored, not read — signature stable through Phase 2. `openedFrom` REQUIRED: dev-warn + refuse when null/undefined. `origin`/`borrow` fields dropped by design (V2 has no FLIP/borrow).

State: `isOpen, posts, activeIndex, activePagerIdx, openedFrom, openId`. `activePagerIdx` is the single source of truth for carousel dots — dots read from store (fixes v1 defect 6).

`engagementBridge` subscribes once at module scope, no-ops when closed, applies delta to in-viewer post snapshots (v1 spec §5 patched in from day one).

## Overlay lifecycle

**Open**: `useSetChromeSuppressed(true)` → `lockBodyScroll()` (ref-counted) → add `route-fullscreen-overlay` body class → paint `#safe-area-shield` transparent → set html/body bg `#000` → `ensureStatusBarOverlayBooted()` + `setStatusBarStyleColor('light', '00000000')` → 180ms fade/scale-in. Snapshot prior shield color for symmetric restore.

**Close**: reverse — unlock scroll, remove class, **restore shield to transparent (never light default)** (v1 defect 16), clear html/body inline bg, `applyRouteChrome(pathname, true)` to re-derive status bar for the underlying route (v1 defect 14).

Mounted once at App root behind `FLAGS.fsv2` gate — return `null` when flag is off.

## Player

`fsv2Player.ts`:
- `attach(el, source: { hlsUrl?, mp4Url? }, { muted, startPosition })`.
- iOS Safari / Median WKWebView: `el.canPlayType('application/vnd.apple.mpegurl')` → assign `el.src = hlsUrl` directly.
- Else: import hls.js (already in `package.json`), `new Hls().loadSource(hlsUrl).attachMedia(el)`.
- Fallback: `mp4Url` when no HLS.
- Poster-first via `<img>` sibling; crossfade 120ms on `loadeddata` / `playing`.

**Audio contract** (fixes v1 defect 1):
- At `openFsv2()`, synchronously in the tap's call stack: read `useSessionAudio.getState().isMuted`, `el.muted = isMuted`, call `el.play()`. No `await` before the first play() — this is the iOS gesture-token requirement.
- While open: subscribe `useSessionAudio` and push `el.muted = state.isMuted` on change.
- Mute button in chrome calls `useSessionAudio.toggle()` only. Both directions live off one source.
- If unmuted `play()` rejects → set muted, retry, show `TapForSoundPill`. Pill clears on next store `isMuted === false`.

## Viewport

`viewport.ts` reads `visualViewport` with sane-clamp (v1 defect 2): fall back to `innerWidth/Height` when `vv.width < 100 || vv.height < 100`. Re-measures on `visualViewport.resize` and `orientationchange`. Exported as `useFsv2Viewport()` hook.

## Slides

- **VerticalSnapPager**: CSS `scroll-snap-type: y mandatory`, `overscroll-behavior: contain`, IntersectionObserver on slides for active-index. Render window ±1 (Phase 1). Swipe down beyond first slide → dismiss.
- **ImageSlot**: contain over cover-blur backdrop (`filter: blur(40px) brightness(0.5)`, `::after` scrim `rgba(0,0,0,0.55)`).
- **VideoSlot**: poster-first, crossfade at first frame. Tap = pause/play. Single element per active slide.
- **Multi-media horizontal pager**: `scroll-snap-type: x mandatory`, top-right dots component reads `activePagerIdx` from store (never lagging external state).

## Chrome (Phase 1 minimal)

Close button (top-left 44px glass), mute button (top-right, uses `useSessionAudio`), author row (avatar + display name, no follow), caption line (2-line clamp). All action affordances (like/comment/share/report/follow) are Phase 2.

## Watchdogs

Every wait has a bounded timer that forces visible recovery:
- Video first-frame timeout 3000ms → force poster reveal + `trace('fsv2.reveal.forced', { openId, reason: 'video-timeout' })`.
- Image decode timeout 2000ms → force reveal with placeholder.
- Store `open()` → paint timeout 800ms → force scroll-to `startIndex` regardless of layout state.
No white-screen path may exit without a trace.

## Instrumentation

New span kinds (dashboards untouched — v1 `fs.*` stays):
- `fsv2.open` — budget 500ms cold video, 200ms image. `vperfStart('fsv2.open:<openId>', 'fsv2.open', { budgetMs })`, mark phases `mounted`/`first-frame`, `vperfEnd` on reveal.
- `fsv2.close` — budget 250ms.
- `fsv2.swipe` — per vertical settle.
- Traces: `fsv2.tap`, `fsv2.slide`, `fsv2.reveal`, `fsv2.reveal.forced` — all tagged with `openId` from `traceGenId()` at open time. All gated by `isPerfEnabled()`.

## Dev entry gating (Phase 1)

`FLAGS.fsv2` added to `src/config/flags.ts` (default `false`). Two surfaces:
1. **Clubhouse cards** — `src/components/feed/CardFeed.tsx` around line 567: at the top of the handler, `if (FLAGS.fsv2) { openFsv2({ posts, startIndex: idx, mediaId, mediaIndex, openedFrom: 'clubhouse' }); return; }` then existing v1 path.
2. **HubMixedGrid** — verify the actual `openedFrom` wiring (audit shows the tap lives in `FeedCard.tsx:127`; HubMixedGrid passes `openedFrom` via props). Gate at the same `handlePress` entry so only HubMixedGrid-originated presses (`openedFrom === 'watch'` from that grid path) route to fsv2 when flag on. All other `FeedCard` consumers stay on v1.

All other surfaces (course-media, posts-tab, deep-link, loop, moments, watch rails other than HubMixedGrid) stay on v1 until Phase 3.

## Verification (ship report from device)

- `tsc --noEmit` clean.
- ESLint fence proven: temporarily add a forbidden import in a fsv2 file, capture the failing lint output, revert.
- 10 open/close cycles per flagged surface — no degradation.
- Media coverage: image post, mixed carousel, single video — all visible < 600ms worst case.
- Audio scenario verbatim: unmute in Clubhouse → tap tile → viewer plays with sound, no mute dance; mute in viewer → close → feed muted.
- Rotate mid-open → stays full-bleed (viewport re-measures).
- Paste one `fsv2.open` trace payload per media type (image, single video, carousel).

## Technical notes

- No borrow, no FLIP, no shared VideoEngine lanes — by decision.
- `hls.js@^1.6.16` already in `package.json`; no add.
- Store is zustand (matches app pattern). Overlay uses `React.memo` + refs for animation frames; no framer-motion (app-wide decommission in progress).
- `MediaItem` fields used: `type`, `hlsUrl`, `mp4Url`, `imageUrl`, `thumbnailUrl` (poster), `width`, `height`, `isProcessing`.
- Open questions to confirm during implementation: exact `openedFrom` string HubMixedGrid passes to `FeedCard`; whether `CardFeed`'s handler receives all data needed at the fsv2 gate point (it does per audit lines 567-576).

## Out of scope (Phase 2+)

Comments sheet, deep-link comment targeting, pagination handoff live wiring, readOnly chrome variants, follow/like/comment/share/report actions, pinch-zoom on images, business-actor actions, deleted-post + processing-video states, notification tap targets, replacing v1 on remaining surfaces.
