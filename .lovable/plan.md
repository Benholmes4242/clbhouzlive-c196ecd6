
# Phase 1 — Video Element Pool + Reparenting

Kill the class of bugs where each feed card mounts its own `<video>` on scroll, causing black flashes, poster re-shows, and mid-swipe stutters as HLS re-parses and first-frame re-decodes.

## The core idea

Today every card owns its own `<video>` element. When you scroll, the outgoing card unmounts (destroys `<video>` + HLS instance + decoded frames) and the incoming card mounts fresh — racing `play()` against manifest parse and first-frame decode. That's the jump.

Instead: keep a small pool of `<video>` elements alive at the app root. When a card becomes active, we **move** (reparent via `appendChild`) a pooled video into the card's slot, hand it the new source, and keep the decoded frame buffer alive across the swap. No teardown, no re-decode, no black flash.

This is the exact mechanism Instagram, TikTok, and the Twitter/X feed use.

## Scope (Phase 1 only)

Just the pool + reparenting infrastructure and Clubhouse feed integration. Profile feeds and fullscreen viewer come in Phase 2 once the pool is proven.

## Deliverables

1. **`VideoPool` singleton** (`src/video/pool/VideoPool.ts`)
   - Maintains N=3 pre-created `<video>` elements (current + prev + next in a snap feed)
   - `acquire(slotKey, hlsUrl, posterUrl)` → returns a live `<video>` element already attached to HLS
   - `release(slotKey)` → returns element to pool, keeps HLS attached (warm)
   - LRU eviction when pool is full — evicted element detaches HLS
   - Elements never unmount from the DOM tree; only reparent between slot containers

2. **`VideoSlot` component** (`src/video/pool/VideoSlot.tsx`)
   - Replaces the direct `<video>` render inside `SnapVideoPlayer` / feed cards
   - Renders an empty container `<div ref>` and a poster `<img>` underneath
   - On mount: `pool.acquire()` → `container.appendChild(video)`
   - On unmount: `pool.release()` (video stays alive in the pool, just detached from container)
   - Poster cross-fade only clears once the pooled video fires `loadeddata` (first frame committed)

3. **HLS attachment lives with the pooled element**, not the slot
   - `VideoPool` owns the `Hls` instance per pooled `<video>`
   - Source swap uses `hls.loadSource(newUrl)` on the same instance where possible (same origin) — avoids the full teardown that causes today's re-parse stall
   - Existing `registerHlsForDebug` registry keeps working, keyed by pool slot id

4. **Wire Clubhouse feed only**
   - `SnapVideoPlayer.tsx` (currently a poster-only chassis after the teardown) gains a `<VideoSlot>` render path
   - Feature-flagged behind `VITE_VIDEO_POOL` — flag ON in dev, OFF in prod until we verify
   - Profile pages, fullscreen viewer, watch grids: **unchanged** in Phase 1

5. **Instrumentation**
   - Log `pool.acquire` / `pool.release` / `pool.evict` to `bootTimeline` + `videoDebug('pool', ...)`
   - New PerfHud row: "Pool: 3/3 warm, last acquire 12ms"
   - So Phase 2 has real data to tune the pool size against.

## Non-goals (later phases)

- AudioBroker singleton (Phase 2)
- Commit-on-first-frame poster fade site-wide (Phase 2, mostly free after pool)
- Neighbor 2-segment prefetch (Phase 3)
- Profile + fullscreen adoption (Phase 2)
- Telemetry sampling (Phase 4)

## Technical notes

- Pool size 3 is deliberate: matches SnapFeed's window (prev/current/next). We'll tune with the new PerfHud row.
- Reparenting a playing `<video>` via `appendChild` is well-supported and does NOT reset playback in Chromium/WebKit — this is the property the pool depends on.
- HLS.js instance reuse across source swaps is safe when the new URL comes from the same manifest origin (which all our Cloudflare Stream URLs do). If ever mixed, we recycle the whole element.
- Nothing changes for profile/fullscreen this phase — those still use their existing paths. This keeps blast radius small and lets us prove the mechanic on the busiest surface first.

## Acceptance

- Clubhouse feed swipes forward/back 20 items with no black flash and no poster re-show once a card has been visited
- No regressions in muted/unmuted state, tap-to-pause, or looping
- `videoDebug('pool', ...)` shows acquire on first visit, release on scroll-off, and re-acquire on scroll-back within <5ms (no re-parse)
- Flag OFF path is byte-for-byte identical to today (no behavior change when disabled)
