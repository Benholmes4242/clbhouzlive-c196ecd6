## Part 0 — Verification findings (from source)

**0a. HOST LIFETIME (CONFIRMED):**
- `CardFeed.tsx:375-377` — `isActive = !fsOpen && index === playingIdx`, `isNear = !fsOpen && …`, `mountVideo = isNear`.
- `LightCardFeed.tsx:234-236` — identical gating.

When the fullscreen viewer opens, `fsOpen` flips true → `isNear`/`mountVideo` become false on **every** card → `InlineVideo` unmounts. The origin card's lane host dies on open, so close-return always hits the target-gone fallback. Part 2 makes the borrowed card's host survive.

**0b. UNMOUNT RACE (CONFIRMED):**
- `useVideoLane.ts` has NO explicit `unmountLane` call — the mount effect (`:66-88`) only appends into the new host; the "old host wins" mechanic is `appendChild`'s atomic move.
- BUT the real threat is the host `<div ref={lane.hostRef}>` (in `InlineVideo.tsx:131`) itself being **removed from the DOM** when `mountVideo` flips false. React unmounts the host `<div>`, and the engine's `<video>` element — currently parented to that div — is unmounted along with it, breaking playback. This is worse than a `pause()` call; the pause-guard doesn't cover it.

The engine's `unmountLane` (`VideoEngine.ts:224`) is called from `returnBorrow` itself; it isn't called by `useVideoLane`. So the Part 1 `unmountLane` guard is still needed as belt-and-braces protection against any future caller (and for tracing symmetry with `eng.pause.borrowed`) — but the **primary** fix is Part 2: keep the origin card's host `<div>` in the DOM while the viewer is open.

---

## Implementation plan

### Part 1 — Engine: extend borrow guard to `unmountLane`
`src/video/VideoEngine.ts` `unmountLane(laneId)`:
- If `this.borrowedLanes.has(laneId)`: log `DBG('unmount.borrowed', { laneId })` + `fsvEl('eng.unmount.borrowed', …)` and `return` early. Don't touch `lane.mountedHost` / `wantPlay`.
- `returnBorrow`'s fallback park already calls `clearBorrowed` FIRST, so its own `unmountLane` executes normally.

### Part 2 — Feeds: keep the borrowed card's host alive
Both `CardFeed.tsx` and `LightCardFeed.tsx`:
- Subscribe (Zustand selector) to `useFullscreenFeedStore(s => s.borrow?.ownerKey ?? null)` as `borrowedOwnerKey`. Memoized selector → non-borrow cards don't re-render on borrow change.
- Change gate:
  ```ts
  const cardOwnerKey = `${post.id}:0`;
  const isBorrowedCard = fsOpen && borrowedOwnerKey === cardOwnerKey;
  const isActive = !fsOpen && index === playingIdx;
  const isNear = isBorrowedCard || (!fsOpen && Math.abs(index - activeIdx) <= VIDEO_NEIGHBOUR_RADIUS);
  const mountVideo = isNear;
  ```
- `isActive` stays false for the borrowed card while viewer is open — engine pause-guard + Part 1 unmount-guard cover any residual activation traffic.
- All other cards keep their existing `!fsOpen` gating.

### Part 3 — Origin host registration (feed variant)
`src/components/feed/InlineVideo.tsx`:
- Add `useEffect` that, when `resolvedOwnerKey && lane.hostRef.current`, calls `originHostRegistry.register(resolvedOwnerKey, lane.hostRef.current)`; cleanup calls `originHostRegistry.unregister(resolvedOwnerKey, lane.hostRef.current)` (element-identity guard already in registry).

### Part 4 — `openWithOrigin`: feed borrow detection
`src/lib/openWithOrigin.ts`, after the existing rail-lane borrow block, if `borrow` still null:
```ts
if (!borrow && postId) {
  try {
    const snap = VideoEngine.snapshot('feed-active');
    const candidateOwnerKey = `${postId}:${mediaIndex ?? 0}`;
    const owns = snap.postId != null && (
      snap.postId === candidateOwnerKey ||
      snap.postId === postId ||
      snap.postId.startsWith(postId + ':')
    );
    const isLive = (snap.state === 'playing' || snap.state === 'ready') && snap.currentTime > 0;
    if (owns && isLive) {
      borrow = {
        laneId: 'feed-active',
        ownerKey: snap.postId ?? candidateOwnerKey,
        postId,
        posterUrl: posterUrl ?? null,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        // Capture pre-borrow mute state so returnBorrow can restore it.
        wasMuted: snap.muted,
      };
      VideoEngine.markBorrowed('feed-active');
      // NO pool pin — feed-active is a singleton lane, not a pool lane.
      BORROW_DBG('mount', { source: 'feed-active', ownerKey: borrow.ownerKey, postId });
    }
  } catch { /* engine may not be booted */ }
}
```
- Also set `startSource = 'borrow'` when the feed borrow triggers (same short-circuit as rail borrow).

### Part 5 — Store: `BorrowDescriptor.wasMuted`
`src/store/fullscreenFeedStore.ts`: add optional `wasMuted?: boolean` to `BorrowDescriptor`. Rail borrows omit → defaults to muted behaviour.

### Part 6 — `returnBorrow`: feed-specific semantics
`src/components/fullscreen-feed/FullscreenFeedOverlay.tsx` `returnBorrow(borrow, reason)`:
- Detect lane kind: `const isRail = borrow.laneId.startsWith('rail-');`
- Mute policy:
  - Rail: unchanged — `setMuted(laneId, true)` always.
  - Feed-active: `setMuted(laneId, borrow.wasMuted ?? true)`.
- Pool policy:
  - Rail: existing `RailLanePool.unpin(...)` calls unchanged.
  - Feed-active: skip both `unpin` calls entirely (no pool interaction). Trace `return.animate` / `return.fallback` with `laneId` so telemetry stays readable.
- `clearBorrowed(laneId)` still runs first for both.
- Live-tile branch: registry lookup by `borrow.ownerKey` works for both; with Part 2 the feed card's host survives → live return path taken. Fallback park (`unmountLane`) unchanged for target-gone.

### Part 7 — `BorrowedFullscreenSlot`: verify (no changes expected)
`FeedSlide.tsx` — takes `laneId` from descriptor. `mountLane` + belt-and-braces `play(laneId, { callerPostId: ownerKey })` work identically for `'feed-active'`. Verify only; ship no change unless a bug surfaces.

### Part 8 — Verify and ship
- `tsgo --noEmit`
- Report Part 0 findings + changed files in ship summary.

---

## Files touched
- `src/video/VideoEngine.ts` — Part 1
- `src/components/feed/CardFeed.tsx` — Part 2
- `src/components/posts-tab/LightCardFeed.tsx` — Part 2
- `src/components/feed/InlineVideo.tsx` — Part 3
- `src/lib/openWithOrigin.ts` — Part 4
- `src/store/fullscreenFeedStore.ts` — Part 5 (`wasMuted` field only)
- `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx` — Part 6

Rail borrow path (PR-1) remains byte-for-byte identical for the mute + pool branches; only the lane-kind switch adds a new branch. Non-borrow openers (image posts, cold tiles, deep links) fall through to the existing ladder unchanged.
