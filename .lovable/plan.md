# Phase 2 — AudioBroker + Profile/Fullscreen Pool Adoption

Phase 1 gave us a 3-element `VideoPool` + `VideoSlot` and wired it into the Clubhouse feed behind `VITE_VIDEO_POOL`. Phase 2 makes audio deterministic across every surface, expands the pool to profile feeds and the fullscreen viewer, then removes the flag.

## What Phase 2 is (and isn't)

Phase 2 is **not** just "remove the flag". The flag comes off only after:
1. One canonical `AudioBroker` decides which single video element is allowed to be unmuted.
2. Profile feeds and the fullscreen viewer render through the same pooled `VideoSlot`.
3. Poster frames cross-fade away only after the first real frame is committed.

Phase 2 is **not** ABR/buffer tuning or neighbor prefetch — that is Phase 3.

## Deliverables

### 1. `AudioBroker` singleton (`src/video/pool/AudioBroker.ts`)
- Maintains a registry of every slot that wants audio (Clubhouse active slide, fullscreen viewer, profile hero, etc.).
- Each registration carries a policy: `inline-session`, `fullscreen-session`, or `always-muted`.
- Subscribes to `useSessionAudio` and re-evaluates on every focus change / fullscreen open / session mute toggle.
- Resolution rule (last-write-wins for focus, fullscreen beats inline):
  - If session is muted → every registered element is muted.
  - If fullscreen viewer is open → the fullscreen slot owns unmuted audio.
  - Otherwise → the most recent inline slot that claimed focus is unmuted.
  - Rails/grids/profile lists default to `always-muted`.
- Writes `video.muted = true/false` directly on the pooled `<video>` element.
- Logs every decision to `videoDebug('audio', ...)` and the existing audio debug buffer.

### 2. `VideoSlot` audio integration
- Add `audioPolicy` and `claimAudioFocus` props.
- On mount, register with `AudioBroker`; on unmount, unregister.
- `isActive && !muted` causes the slot to claim focus (last-write-wins).
- The existing `muted` prop is still honored as a local override.

### 3. Commit-on-first-frame poster fade (site-wide)
- `VideoSlot` already cross-fades the poster after `loadeddata`.
- Harden it so the poster never disappears before `videoWidth > 0`.
- Add a 200ms CSS opacity transition for smoothness.
- Ensure the first-frame gate also works on warm-hit re-acquires (element already decoded).

### 4. Profile feed adoption
- `MomentCard.tsx`: when `mediaType === 'video'`, render `VideoSlot` instead of the static poster `<img>`.
- `HeroMedia.tsx`: when `mediaType === 'video'`, render `VideoSlot` behind the fading poster.
- `MomentFullscreenViewer.tsx`: render a single `VideoSlot` for the current moment, with `audioPolicy="fullscreen-session"`.
- Profile grids/lists stay `always-muted`.

### 5. Fullscreen viewer adoption
- `FeedSlide.tsx` fullscreen branch: replace the `VideoEngine` lane mount with `VideoSlot`.
- Borrow/return animation still needs to work. Approach:
  - Keep the origin-host registry and FLIP animation in `FullscreenFeedOverlay.tsx`.
  - The borrowed element is now a pooled `<video>` reparented into the fullscreen host.
  - On close, reparent it back to its origin slot (or let the pool reclaim it).
- Horizontal media pager inside fullscreen also uses `VideoSlot`.

### 6. Remove the feature flag
- Change `isVideoPoolEnabled()` to return `true` by default (keep the localStorage override as an emergency kill-switch).
- Delete the poster-only fallback branch in `SnapVideoPlayer.tsx`.
- Update `.env.example` to remove `VITE_VIDEO_POOL` (or leave it documented but default true).
- Add a `PerfHud` row showing pool occupancy and last acquire time.

## Technical notes

- `VideoEngine` lanes and `VideoPool` will coexist during this phase. `AudioBroker` is the bridge: `VideoEngine` lanes already respect `useSessionAudio` and `audioFocus`; `VideoPool` slots register with the same `useSessionAudio` store so they never fight.
- The fullscreen borrow path is the riskiest surface. We will keep the existing `FullscreenFeedOverlay` close-animation logic and only swap the element source from `VideoEngine.mountLane` to `VideoPool.acquire`.
- Safari native HLS path remains supported: `AudioBroker` still works because it mutates the `<video>` element directly.

## Acceptance

- Clubhouse feed swipes remain black-flash-free with the flag removed.
- Unmuting the active Clubhouse slide unmutes exactly that video; all other inline videos stay silent.
- Opening fullscreen from a rail/grid/feed tile transfers audio to fullscreen without a second tap.
- Closing fullscreen returns audio to the originating surface (or stays muted if session is muted).
- Profile `MomentCard` and `HeroMedia` videos autoplay muted inline; tapping into `MomentFullscreenViewer` speaks if session is unmuted.
- `videoDebug('audio', ...)` logs show a single speaker at all times.
- tsc + eslint clean; no regressions in tap-to-pause or looping.
