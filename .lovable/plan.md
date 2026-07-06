# Stage 7 PR-3 — In-fullscreen media carousel

Adds a horizontal media sub-pager to each fullscreen slide for multi-media posts, wired to the SHOWING lane per active page and to a first-swipe borrow demote. Engine / pool / borrow-guard code is not touched.

## Scope

- `src/components/feed/FeedSlide.tsx` — new inner `FullscreenMediaPager` component; single-media path unchanged (byte-for-byte).
- `src/store/fullscreenFeedStore.ts` — add a one-shot `demoteBorrow()` action + a `borrowDemoteRequested` flag so the pager can request demotion without importing overlay internals.
- `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx` — subscribe to `borrowDemoteRequested`, run `returnBorrow(borrow, 'demote')` (idempotent with the existing swipe-away demote), clear the flag.

No changes to `VideoEngine`, `RailLanePool`, `useVideoLane`, `usePinchZoomPointer`, or `SnapFeed`.

## Behavior

### Part 1 — Horizontal pager (fullscreen, media.length > 1)

Wrap the media area in a horizontal scroller with CSS scroll-snap (100% per page). Each page renders through the existing per-media branches: video+hlsUrl → `FullscreenVideoSlot`; image → pinch-zoom image; anything else → poster only. Only the ACTIVE page's video mounts `FullscreenVideoSlot` (binds SHOWING lane); inactive pages render a poster-only fallback identical to the existing non-hls branch. This preserves the one-decoder-per-slide rule.

Initial page = existing `openIdx` (from `mediaId` resolution). Dots use the existing `CarouselDots` (variant `elongated`) at bottom-center, hidden for single-media (in which case the pager is not rendered at all).

Active-page transitions:
- Track the pager's active index in local state (`activePagerIdx`, initialised to `openIdx`), updated by scroll-snap intersection observer (mirrors `FeedImageCarousel`).
- Video → video: switching pages simply swaps which page mounts `FullscreenVideoSlot`; the new slot binds `fullscreen` lane with `postId={post.id}` and per-media resume comes for free (PR-2 fix + `VideoEngine.getLastPos` fallback keys on the bare postId; we pass the post id, not an ownerKey — matches the SHOWING-lane contract on fullscreen).
- Image page: the previously-active video page unmounts its slot → `useVideoLane` deactivates → engine pauses the SHOWING lane. No explicit pause call needed.

### Part 2 — Borrow demote on first horizontal swipe

On the borrow slide (`borrow && post.id === borrow.postId && isActive`), the FIRST change of `activePagerIdx` away from `openIdx` triggers demotion:

1. Log `[BORROW] carousel-demote { ownerKey, laneId, newMediaIndex }`.
2. Call `useFullscreenFeedStore.getState().demoteBorrow()` — sets `borrowDemoteRequested = true`.
3. Overlay effect (new) sees the flag, runs the existing `returnBorrow(borrow, 'demote')` path (park in hidden host, unpin, clear), clears the flag, calls `clearBorrow()`.
4. Because demote runs SYNCHRONOUSLY before React commits the pager's new active page (state update batched into the same tick — we call `demoteBorrow()` first, then let the pager scroll finish), the newly active page mounts `FullscreenVideoSlot` with `isBorrowSlide=false` → standard fullscreen-lane load via `useVideoLane`. Swiping BACK to `openIdx` re-mounts the same slot (still `isBorrowSlide=false` — the store's `borrow` is now null) → standard fullscreen-lane load with `getLastPos(postId)` — no re-borrow.

The existing vertical-swipe-away demote (`activeIndex !== startIndex`) remains. `returnBorrow` is already effectively idempotent because it uses `borrowRef.current` and the overlay guards `if (!borrow) return`; we harden that with a "already cleared" no-op guard in `demoteBorrow()` (only sets the flag when `borrow` is present).

### Part 3 — Gesture arbitration

Rely on native browser scroll-snap for horizontal pan + `SnapFeed`'s outer vertical scroll — CSS `overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory` on the pager, and the outer feed keeps `scroll-snap-type: y mandatory`. Browsers axis-lock on initial gesture and release to the parent scroller when the inner is at its scroll edge — matches `FeedImageCarousel`'s existing behavior. Pinch-zoom on image pages continues to work because `usePinchZoomPointer` is mounted per-page and captures its own pointers. No custom pointer arbitration is added (would fight the pinch hook).

### Part 4 — Preserved

- Vertical swipe between posts, PR-1 vertical demote, one-unmuted-lane invariant, mute-restore on close, PR-2 return semantics: unchanged.
- readOnly viewers (course media) receive the pager — it's a media control.
- Single-media fullscreen slides skip the pager entirely (guarded by `media.length > 1`).

## Technical notes

- `FullscreenMediaPager` renders `media.length` full-viewport pages side-by-side, each wrapping the existing render branches. Inactive video pages render only the blurred backdrop + poster (identical to the non-hls fallback already present at lines 156-172 of `FeedSlide.tsx`).
- Scroll-snap tracking: `IntersectionObserver` with `threshold: 0.6` per page, same pattern as `FeedImageCarousel`.
- `demoteBorrow()` store action: `if (!get().borrow) return; set({ borrowDemoteRequested: true })`. Overlay effect on `[borrowDemoteRequested, borrow]` runs `returnBorrow(borrow, 'demote')` + `clearBorrow()` + resets the flag. This lifts the demote trigger out of FeedSlide without exposing overlay internals.
- Log tag: reuse the existing `BORROW_DBG` helper in overlay for the `carousel-demote` trace (guarded by perf flag, same as `mount`/`unpin`).
- No changes to `openWithOrigin`, `startPosition`, or `mediaId` handoff — the pager reads `openIdx` from existing props.

## Acceptance verification

After implementation:
1. Typecheck (`tsgo --noEmit`) + `npm run build` clean.
2. Grep confirms no changes in `VideoEngine.ts`, `useVideoLane.ts`, `useRailLane.ts`, `RailLanePool`, `SnapFeed.tsx`.
3. Manual verification checklist matches the brief (Ben's device pass).
