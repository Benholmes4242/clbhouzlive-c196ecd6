# CLBHOUZ Page Perf & QA Handbook

> Sections may be added over time. The **Video Engine** section below is the
> definitive reference at Stage 7 PR-4 sign-off.

---

## Video Engine

### 1. Core rule

One `<video>` element = one `hls.js` instance = one owner, for that element's
entire life.

- To show video somewhere new, **re-point the source** (`hls.loadSource(url)`)
  on an existing lane. NEVER move an `hls` instance between elements. NEVER
  `detachMedia` -> `attachMedia` to "hand off".
- Lane elements themselves may relocate between surface hosts via
  `mountLane(host)` -> `hostEl.appendChild(lane.el)` only. The hls instance
  follows its element -- that's legal, because we never swap the instance.
- React never owns lane elements. The engine mints them once (into a hidden
  host container) and re-parents them on demand.

### 2. Lane model

Seven lanes, minted at boot in `VideoEngine.boot()` (see `lanePolicy.ts`):

- `fullscreen` -- the fullscreen viewer lane.
- `feed-active` -- the singleton lane for whichever feed card is active.
- `feed-next` -- pre-warm lane for the next feed card (preload only, never
  played visibly).
- `rail-0`, `rail-1`, `rail-2` -- the rail pool. Any rail surface (Watch,
  Explore grids, course media, profile media) borrows from these three via
  `RailLanePool`.
- One reserved id per lanePolicy.

**Pool budget**: 3 rail lanes, LRU eviction, `pin()` / `defer()` protect
lanes borrowed by the fullscreen viewer from being reclaimed while in
flight; `unpin()` releases them.

**`wantPlay` semantics**: `play()` sets `lane.wantPlay = true` and persists
that intent across source changes, mount/unmount, and canplay events. The
mount effect kicks playback if `wantPlay` is set. `pause()` clears it.

**`readyToShow` / `firstFrame` reveal**: `firstFrame` flips only when the
element playhead has reached (or passed) `startPosition - 0.3s`. Surfaces
that need to reveal the video on top of a poster (fullscreen open, feed
resume) gate their opacity on `snapshot.firstFrame` -- preventing a frame-0
flash when the seek hasn't landed yet. Rail lanes also flip via this gate.

**Poster attribute lifecycle**: `load()` writes `lane.el.poster = posterUrl`
so the browser has a cover during cold load. On the first painted frame,
`markReadyToShow()` calls `lane.el.removeAttribute('poster')`. That removal
matters: without it, subsequent `appendChild` re-parents (borrow / return /
host swaps) re-composite the poster image over the running video for one
frame. Future cold loads re-set the poster attribute per new source.

### 3. `ownerKey` invariant

`lane.postId` is the ownership key. By convention it stores an **ownerKey**
of the form `` `${postId}:${mediaIndex}` `` when a caller has media-level
granularity (feed carousels), and a bare `postId` for single-media legacy
callers.

- Every `load()` / `play()` / `pause()` caller passes
  `callerPostId: ownerKey ?? postId`.
- The `load()` **skip-reload guard** is a strict `===` compare on
  `lane.postId` and `lane.hlsUrl`. BY DESIGN -- do not soften. It preserves
  per-slide granularity for carousel media: swapping media index inside a
  post is a fresh load, not a no-op.
- Shape reconciliation happens at caller boundaries. `InlineVideo` derives
  `resolvedOwnerKey = ownerKey ?? (postId ? \`${postId}:0\` : null)` and
  passes that same string as both `postId` and `ownerKey` so the strict
  compare stays consistent.
- `getLastPos(key)` has a **read-side bare -> `${key}:0` fallback** only.
  It never writes; write-side keys are always what the caller stamped.

### 4. Borrow architecture

Rail-tile and feed-active taps that hit a **live playing lane** for the
same post borrow the running `<video>` element into the fullscreen viewer
instead of opening a fresh `fullscreen` lane. This eliminates the tap ->
seek -> first-frame ladder for the common case.

**Flow**:

1. `openWithOrigin()` decides borrow eligibility (rail lane via
   `RailLanePool.laneFor(ownerKey)`, then `feed-active` snapshot ownership
   + `isLive` check).
2. `RailLanePool.pin(laneId)` (rail borrows only) locks the lane from
   pool eviction.
3. `VideoEngine.markBorrowed(laneId)` flips the engine's borrow flag on
   that lane.
4. `useFullscreenFeedStore.open(..., borrow)` hands the descriptor to the
   overlay.
5. `<BorrowedFullscreenSlot>` `appendChild`'s the live element into its
   wrapper, runs the cover -> contain FLIP, and immediately fires
   `onFirstFrameReady` (the element is already painting).
6. Owner tile issues a `pause()` on the lane; the borrow guard rejects it.
   The tile transitions to poster-only presentation while the viewer runs.

**Owner-caller pause / unmount suppression** (in `VideoEngine`):

- `pause(laneId, { callerPostId })` when `borrowedLanes.has(laneId)` and
  `caller != null` -> logged as `[VideoEngine] pause.borrowed { laneId,
  caller, lanePostId }` and returned. Null-caller engine-wide pauses
  (`pauseAll`, `document.hidden`, review sheet, post studio, review wizard)
  ALWAYS pass -- borrow guard checks `caller != null`.
- `unmountLane(laneId)` when borrowed -> logged as `[VideoEngine]
  unmount.borrowed { laneId, postId }` and returned. Otherwise re-parenting
  the element into the hidden host would steal it back mid-playback.

Both are **permanent regression tripwires** -- do not remove.

**Return paths** (`FullscreenFeedOverlay.returnBorrow`):

- **Live FLIP-return**: still-live origin host present + not demoted ->
  re-parent the element back to the origin host with a reversed FLIP.
- **Park fallback**: origin host missing -> park the element in the hidden
  host, pause it (rails force-mute on park; feed-active restores `wasMuted`
  from the borrow descriptor).
- **Demote**: user swiped horizontally to a sibling media inside the
  viewer; the origin tile no longer owns the borrowed media, so the return
  goes to park instead of the origin. One-shot: subsequent slides in the
  same session don't re-demote.
- **Deferred release**: consecutive close attempts are coalesced so the
  pool `unpin()` fires once.

**Origin host registry** (`originHostRegistry`): tiles register their
host `<div>` under `${postId}:${mediaIndex}` at mount, unregister on
unmount. `returnBorrow` reads the registry to decide FLIP vs park.

### 5. Surface wiring recipe

Any new surface that renders `<video>` follows five steps:

1. **Pick a lane**: rail pool for scroll grids (`useRailLane`), feed-active
   for single-media feeds (`InlineVideo`), fullscreen for the viewer,
   feed-next for pre-warm.
2. **Wire `useVideoLane`** (or the specific hook): pass `hlsUrl`,
   `posterUrl`, `active`, `muted`, and `postId: resolvedOwnerKey` (never a
   bare `postId` when carousel media exists). Host ref lives on the visual
   container the engine appends into.
3. **Register the origin host** (`originHostRegistry.set(ownerKey, host)`)
   on mount, unregister on unmount. Required for live FLIP-return.
4. **Wire `openWithOrigin`** on tap: pass `originEl`, `railOwnerKey`,
   `mediaIndex`, `mediaId`, and `openedFrom`. The borrow decision is
   automatic.
5. **Reveal on `snapshot.firstFrame`**: gate the video's opacity on
   `firstFrame === true` so the poster covers the seek-in flash. Poster
   image sits underneath the video host.

**Lessons from PR-2 / PR-3**:

- Gate viewer-state selectors inside **wrapper components** so a Zustand
  subscription can't enter the virtualizer's `itemContent` deps. When the
  wrapper subscribes and the child receives values as props, virtualizer
  reconciliation stays cheap.
- The **borrowed card is host-mount exempt**: `FeedSlide` short-circuits
  its own `useVideoLane` when `isBorrowSlide` (`hlsUrl:null` + `active:
  false`) so the fullscreen lane isn't touched -- the borrowed rail
  element renders inside `<BorrowedFullscreenSlot/>` instead.
- **Any new gesture layer inside a scroller re-audits descendant
  `touch-action`**. PR-3 discovered `usePinchZoomPointer` set
  `touch-action: pan-y` at `scale=1`, which killed the horizontal
  scroll-snap pager the moment a gesture started on an image page. The
  fix is `pan-x pan-y pinch-zoom` at scale 1, then `none` while zoomed
  (JS owns pan+pinch). Any similar layer needs the same base value.

### 6. Debugging playbook

**The DBG pill**: `isPerfEnabled()` in `@/perf/navTiming` reads a
localStorage flag surfaced via the on-device DBG toggle. Every engine
trace is gated on it (plus `window.__VIDEO_ENGINE_DBG__` as a browser
convenience escape hatch). All engine traces go through
`DBG(...) -> console.info('[VideoEngine]', ...)`.

**Permanent trace families** (kept forever):

- `[VideoEngine] ...` -- engine lifecycle (mount / unmount / load / play /
  pause / released / state transitions), and the two regression tripwires
  `pause.borrowed` and `unmount.borrowed`.
- `[POOL] ...` -- rail pool pin / defer / evict / unpin.
- `[BORROW] ...` -- borrow lifecycle from `openWithOrigin` (pin, mount,
  carousel-demote, unpin).
- `[RAIL] ...` -- rail-lane activation (`useRailLane` picks).
- `[VDIFF] ...` -- per-surface render diagnostics added ad-hoc during
  surface wiring and stripped at sign-off. No call sites today.

**Happy-path signatures**:

- Borrow open: `[BORROW] pin` -> `[BORROW] mount` -> `[VideoEngine]
  pause.borrowed { laneId, caller, lanePostId }` (tripwire proves the
  owner-caller pause was suppressed).
- Demote: `[BORROW] carousel-demote` -> subsequent close routes to
  `[BORROW] park` (not FLIP-return) -> `[BORROW] unpin`.
- Close (live FLIP-return): `[BORROW] flip-return` -> `[BORROW] unpin`.
- Close (park fallback): `[BORROW] park` -> `[BORROW] unpin`.

**Dual-shape checklist** (when a lane pause / load misbehaves):

1. Is the caller stamping the same shape (`ownerKey`) as the last
   `play()`?
2. Is `getLastPos` being read with the same shape it was written under?
   (Read-side bare -> `:0` fallback covers legacy read paths only.)
3. Are you passing `callerPostId` on both `play` and `pause`? A `null`
   caller pause is engine-wide and BYPASSES the owner guard.
4. If a pause was rejected as stale, the caller shape drifted -- fix at
   the caller, don't soften the compare.

**Render-diagnosis lessons**:

- **Settle before diagnosing**: measure host rects after `body`-class and
  status-bar mutations settle (single `requestAnimationFrame`), not on
  the same tick as `setIsOpen(true)`.
- **Identity booleans, not derived**: for gates like `isBorrowSlide`,
  compute the identity once from the source of truth (the store's borrow
  descriptor + the slide's `postId`) and thread it as a prop -- don't
  re-derive per render.
- **Probe with `[VDIFF]`**, not `console.log`. VDIFF is gated on the DBG
  pill so on-device traces are consistent with the rest of the engine
  narrative.
- **Never diagnose on the web preview**. The engine's timing depends on
  the WebView's media pipeline (iOS HLS quirks, Android decoder budget).
  Ship a DBG build and read the device logs.

---

*Last rewritten: Stage 7 PR-4 sign-off. Source of truth: current
`src/video/VideoEngine.ts`, `src/lib/openWithOrigin.ts`,
`src/components/feed/FeedSlide.tsx`, `src/video/railLanePool.ts`,
`src/hooks/usePinchZoomPointer.ts`.*
