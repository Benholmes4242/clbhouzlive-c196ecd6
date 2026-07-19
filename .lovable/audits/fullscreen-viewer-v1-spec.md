# Fullscreen Viewer — Current-Implementation Spec (V1 Audit)

Read-only spec for the parity brief of the V2 rebuild. Everything below is
what the CURRENT viewer DOES as of this audit; no proposals. File references
are load-bearing anchors, not implementation guidance for V2.

Core files (LOC noted for scope):
- `src/store/fullscreenFeedStore.ts` (389) — the viewer's single source of truth.
- `src/lib/openWithOrigin.ts` (577) — shared opener + borrow decision + resume ladder.
- `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx` (1107) — the root overlay component.
- `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx` (526) — persistent top/bottom chrome.
- `src/components/fullscreen-feed/FullscreenScrubber.tsx` (395) — bottom scrubber + tap-to-pause.
- `src/components/feed/SnapFeed.tsx` (844) — vertical pager (shared with inline feed).
- `src/components/feed/FeedSlide.tsx` (1669) — per-post slide, per-post horizontal pager, video/image slots.
- `src/lib/media/resolveRestingRect.ts` — single-authority resting geometry.
- `src/lib/media/transitionMode.ts` — `FS_TRANSITION_MODE = 'cut'`, `FS_CUT_FADE_MS = 90`.

---

## 1) Entry points

Every opener resolves to `useFullscreenFeedStore.getState().open(...)` — either
directly (deep-link openers) or via `openWithOrigin({...})` in
`src/lib/openWithOrigin.ts` which additionally snapshots tile geometry, runs
the borrow decision, snapshots the resume playhead, flips the WebView status
bar, and delegates to `store.open`.

Every call site passes an `openedFrom` surface tag; ownership for append/paginate
is gated with `useIsViewerOwnedBy(surface)` in the opener so background surfaces
cannot leak posts into a viewer another surface owns.

Enumerated entry points (as found by `rg openWithOrigin\(|store\.getState\(\)\.open\(`):

| Surface (`openedFrom`) | Opener file | Passes origin? | Passes railOwnerKey? | Paginates? | ReadOnly? |
| --- | --- | --- | --- | --- | --- |
| `'clubhouse'` | `src/components/feed/CardFeed.tsx:567` (+ 578 non-origin fallback via `openFullscreen`) | yes | no | yes (feed hook via store `setPaginationState`) | no |
| `'clubhouse'` | `src/components/feed-cards/FeedCard.tsx:128` | yes | no | yes | no |
| `'course-reviews'` | `src/components/courses/course-detail/CourseReviewsTab.tsx:343` | yes | no | no | no |
| `'about-strip'` | `src/components/courses/course-detail/AboutMediaStrip.tsx:312` | yes | no | no | no |
| `'course-media'` | `src/components/course-media-tab/CourseMediaCanonGrid.tsx` (open + `useIsViewerOwnedBy('course-media')` → `appendPosts(...)` at 162) | yes | no | **yes** (opener owns the query; mirrors pagination into the store) | **yes** |
| `'posts-tab'` | `src/components/posts-tab/LightCardFeed.tsx:348, 366` (+ `PostsTabContent.tsx:190` owner-gated appends) | yes | no | yes | no |
| `'explore'` | (opens Clubhouse indirectly) + `src/components/explore-tab-new/ExploreGrid.tsx:104` owner-gated `appendPosts(coursePosts)` | — | — | yes (as append-owner while another surface's viewer is not owning) | — |
| `'watch'` | `src/features/watch-v2/components/HubVideoRow.tsx:68`, `HubClipsRow.tsx:53`, `src/features/videos-v2/components/VideoFeedCard.tsx:68`, `ClipsInterruptShelf.tsx:67` | yes | **yes** (rail tile ownerKey — enables borrow branch) | no | no |
| `'post-deep-link'` | `src/pages/PostDeepLinkPage.tsx:216` (bypasses `openWithOrigin` — direct `store.open([feedPost], 0, { openCommentsInitially, initialCommentId, onClose })`) | no (opacity fade fallback) | no | no | no |
| — (legacy read-only gallery) | `src/components/courses/phase5/CourseMoments.tsx:66` — direct `store.open(fullscreenPosts, index, { readOnly: true })` | no | no | no | yes |
| — | `src/components/loop-tab/LoopCard.tsx:220, 267, 422` — direct `store.open(allPosts, cardIndex)` | no | no | no | no |

Shape passed to `open(...)` (`OpenOptions`, see `fullscreenFeedStore.ts:48-93`):
- `posts: FeedPost[]` (positional), `startIndex: number`.
- `origin: OpenOrigin | null` — tile `rect` (top/left/width/height), `posterUrl`,
  computed `borderRadius`, `aspectRatio`, plus intrinsic
  `originMediaW/H` (grouping-safe) and `mediaType: 'video' | 'image'`.
- `mediaIndex` (positional fallback) AND `mediaId` (authoritative — resolved against grouped `post.mediaItems`).
- `openCommentsInitially`, `initialCommentId` (deep-link notification target).
- `onClose` callback (deep-link routes go back instead of just hiding).
- `hasNextPage`, `fetchNextPage`, `isFetchingNextPage` — pagination handoff; opener also calls `setPaginationState` over time to keep it live.
- `readOnly` — hides like/comment/share/follow chrome (media galleries).
- `startPosition` (seconds) — two-way resume seed.
- `openedFrom` — REQUIRED surface tag (gates append via `useIsViewerOwnedBy`).
- `borrow: BorrowDescriptor | null` — Stage-7 live rail-lane descriptor
  (`laneId, ownerKey, postId, posterUrl, viewportW, viewportH`).

Surface tag / ownership behaviour: only the surface whose tag equals
`store.openedFrom` runs its `appendPosts(...)` on new-page fetches — other
grids/feeds skip the effect while the viewer is open under a different tag.

---

## 2) UI + interaction inventory

The viewer DOES render, top to bottom, over a `#000` wash layer:

1. **Root overlay (`FullscreenFeedOverlay`)** — `AnimatePresence` + `motion.div`,
   `zIndex: FS_OVERLAY_Z`, opacity ease-in over `FS_CUT_FADE_MS` (90ms) in `cut`
   mode. In `expand` mode a poster-clone FLIP tile→viewer expand runs (details §3).
   The overlay ALSO calls `useSetChromeSuppressed(isOpen)` (chrome-v2 left override)
   to unmount the app's top-left/right chrome island for the duration of the open.

2. **Vertical post pager (`<SnapFeed surface="fullscreen" isFullscreen readOnly>`)**
   — reused component that owns:
   - CSS scroll-snap vertical pager with `VIRTUAL_WINDOW = 5` around the active
     index (11-slide window), IntersectionObserver at thresholds `[0.25, 0.5, 0.75]`,
     debounced active-index update (`ACTIVE_INDEX_DEBOUNCE_MS = 20`).
   - Initial scroll to `startIndex` on first mount with rAF retry until layout.
   - `onNearEnd(NEAR_END_THRESHOLD = 3)` → overlay calls `fetchNextPage` via
     store handoff.
   - `haptics` on settle.
   - Perf spans `swipe.vertical` (budget 450ms) armed on `fullscreen` lane
     `firstFrame`/`playing`; skipped entirely for image slides (no lane events).

3. **Per-post slide (`<FeedSlide isFullscreen isActive>` in `FeedSlide.tsx`)** —
   inside each vertical slide the viewer DOES render:
   - Horizontal media pager (scroll-snap-x, `touch-action: pan-x pan-y pinch-zoom`).
     Only the active page mounts the video slot; inactive pages render the poster.
   - Segmented **CarouselDots** at the bottom of the screen (rendered by
     `ImmersiveFullscreenChrome` when `mediaCount > 1`); the inline top-right
     dots that inline-feed FeedSlide draws are suppressed when `isFullscreen`.
   - `<FullscreenVideoSlot>` — engine-bound `fullscreen` lane. Poster-first
     paint, 120ms crossfade poster→video on real first frame, `object-fit`
     derived from `resolveRestingRect(fit)` (portrait/square video = COVER
     full-bleed; landscape video = CONTAIN inside safe area).
   - `<FullscreenImageSlot>` — image counterpart. Uses `useLayoutEffect` +
     `visualViewport.resize` + `orientationchange` listeners to re-measure the
     resting rect (guards against iOS visualViewport degenerate reads at
     overlay-mount tick — see §7).
   - Pinch-zoom on image pages via `usePinchZoomPointer` (`imgRef` + `zoomStyle`);
     when any image is zoomed `anySlideZoomed` propagates and the vertical
     pager honors that state.
   - `<BorrowedFullscreenSlot>` — on the OPENING slide only, when
     `store.borrow` is present. Re-parents the live rail/feed-active lane's
     `<video>` element into the fullscreen host, sized against
     `resolveRestingRect`. Owns its own expand transition in `'expand'` mode;
     in `'cut'` mode mounts pre-settled.
   - `<VideoProcessingCard overlay />` when `mediaItem.isProcessing` is true
     (backend transcoding).

4. **`<ImmersiveFullscreenChrome>` (`z: Z.echo + 2 / Z.echo / Z.echo + 1`)** —
   persistent (no idle-fade). Layout:
   - **Top-left**: 44px `rgba(0,0,0,0.32)` circular back chevron. Calls `onClose`.
   - **Top-right**: course block — course name (15/600 white, ellipsis, drop
     shadow) → course location row (12/0.8 white with `MapPinIcon`) → community
     rating chip (`bg rgba(255,255,255,0.08)`, 1px `rgba(255,255,255,0.12)`
     hairline, 8px blur, tabular numerals). Rating source cascades:
     `activePost.courseRating` → `useCourseRatingAggregates(courseId).avg_overall_score`.
     Tap on any part calls `handleCourseTap` → `navigate('/courses/:id')` after
     `onBeforeNavigate?.()` (routes through `handleClose` for correct teardown).
   - **Bottom-left**: 40px SquircleAvatar (`hairlineRing`), name (15/600, ellipsis),
     sub-row `[timeAgo · FeedFollowPill]`, and if `activePost.isReview`, a
     `read review ›` link (opens the review sheet via `openReviewSheet`).
   - **Bottom-right vertical action rail** (hidden entirely when `readOnly`):
     `Mute/Unmute` (Volume2/VolumeX, drives `useSessionAudio.toggle()` + light
     haptic), `Heart` (like — filled amber when liked, count in tabular nums),
     `MessageCircle` (comments — opens `CommentsSheetV2`), `Send` (share),
     `MoreHorizontal` (opens `MoreOptionsDrawer` — copy link, report, not
     interested; `onAfterBlock` triggers `handleClose`).
   - **Feed-ended state**: when `!hasNextPage && activeIndex >= posts.length`
     the chrome renders back-chevron ONLY (see `SnapFeed`'s end-of-feed plate
     branch; other UI suppressed via `feedEnded` prop).
   - **Editorial cards** (`postType` = `'tournament_result' | 'pga_card' |
     'course_of_week_card'`) OR `isTournamentCardActive` → chrome returns
     `null` (card owns its own UI).
   - Course-chip / avatar row use their own `drop-shadow` filters (no scrim
     layer). Prior top/bottom scrim gradients were removed.
   - Caption expand: NOT rendered in this chrome — captions live in the review
     tap → review sheet, and the read-review link is the only textual affordance.

5. **`<FullscreenScrubber>` (`z: Z.echo + 3`)** — very-bottom-edge scrubber:
   - Renders ONLY when the active media (via `activePagerIdx` + `activeMedia.type`)
     is a video. Image pages → returns `null`, tap-to-pause listener not armed.
   - Thin white progress bar (3px at rest / 6px while dragging), rAF-polled
     from `VideoEngine.snapshot(laneId)`. Lane is `borrow.laneId` while a
     borrow is live for the active post; otherwise `'fullscreen'`.
   - Drag/seek is owner-key-gated: `expectedOwnerKey(activePost.id, pagerIdx)`
     is matched against `snap.postId`; seek is rejected if the lane repointed.
     Seeks go through `VideoEngine.seek(lane, target)`, never raw element.
   - Time bubble above the thumb while dragging (Geist tabular nums).
   - **Tap-to-pause**: window-level `pointerdown/move/up/cancel` listeners
     detect a clean single-finger tap (<10px move, <300ms, single pointer)
     whose composed path does NOT include `data-immersive-chrome`,
     `data-fs-scrubber`, `data-immersive-tap-skip`, or any BUTTON/A/role
     element. On clean tap it toggles `VideoEngine.play/pause(lane, {
     callerPostId, viaViewer: true })` (`viaViewer` bypasses the borrow-swallow
     guard so pause works while still on the borrowed rail lane) and records
     the intent in `pausedOwnerKeys` (session-scoped set that suppresses
     auto-play on remount).
   - Center flash icon (78×78 rounded button, 400ms `fs-scrubber-flash` keyframe
     ease-out) rendered on each toggle.

6. **CommentsSheetV2** — rendered as an overlay-sibling when `!readOnly`.
   - Opens via `openComments()` (Clubhouse comments hook). ESC handler in the
     overlay defers to the sheet's own ESC if it's open on top.
   - Opens directly to a specific comment when `openCommentsInitially` is set;
     `initialCommentId` is threaded to the sheet for highlight/scroll-to, then
     cleared after 1200ms so subsequent swipes don't re-scroll.

7. **TapForSoundPill** — appears above the scrubber when
   `VideoEngine.onAutoplayBlocked` fires while the overlay is open and audio
   is muted. Clears on unmute (from the pill, the chrome mute button, or
   `MediaPreviewViewer`). Positioned `bottom: env(sab, 0px) + 96px`.

8. **Blurred self-backdrop layer** — position:fixed inset:0, `backgroundImage:
   url(origin.posterUrl)`, `blur(40px) brightness(0.5) saturate(1.2)`,
   `scale(1.2)`, fades in with the clone (`'expand'` only). Product rule:
   contained media in fullscreen is surrounded by a blurred self-backdrop,
   never solid black. In cut mode the settled slide's own backdrop provides
   the surround from frame 0.

9. **Swipe-to-dismiss**: NOT implemented as a spatial gesture. The vertical
   pager owns vertical swipes for post navigation; the horizontal pager owns
   horizontal swipes for media. Dismissal is via back chevron / ESC / hardware
   back only.

10. **States** other than 'normal':
   - Empty (`posts.length === 0`) → `<ClubhouseSkeletonShimmer isVisible isStatic={false}/>`.
   - Video still transcoding → `VideoProcessingCard overlay`.
   - Editorial card posts → chrome returns null (card renders its own UI).
   - `readOnly` gallery mode → hides action rail, comments/report/share/follow,
     and skips deep-link comments effect.
   - Business-actor: chrome resolves the CURRENT actor via `useActiveActor`
     (personal fallback: `{ type:'personal', id: userId }`) so business-mode
     users like/comment/follow AS their business.
   - Deleted posts → not special-cased in the viewer; if delta arrives via
     `engagementBus`, `applyEngagementDelta` patches; if the post disappears
     from the underlying source there is no explicit removal path in the
     viewer.

---

## 3) Behavioral contracts

**Append/pagination at list end** — the overlay reads `hasNextPage`,
`fetchNextPage`, `isFetchingNextPage` from the store. When `SnapFeed` fires
`onNearEnd` (3 slides from the end) the overlay calls `fetchNextPage()`. The
opener surface then calls `appendPosts([...])` on the store — but only after
guarding with `useIsViewerOwnedBy(openedFrom)` so appends from a background
surface can't leak into a foreground viewer. Surfaces that DO paginate today:
Clubhouse feed, posts-tab, course-media (readOnly), explore (as append-owner
of coursePosts). Non-paginating surfaces (deep-link, moments, watch tap,
course-reviews, about-strip) leave `hasNextPage: false`.

**State preserved on close**:
- `#root` scrollTop — snapshotted in a `useLayoutEffect` at open, restored
  in the same synchronous block (so frame 0 composites with the correct
  scroll) AND restored again on rAF at cleanup. Prevents visible jump.
- Last video playhead — written by the engine's session `lastPos` map;
  `openWithOrigin` reads it back on the next open (see §4 ladder rung).
- Session mute state — `useSessionAudio` (survives close). See §4.
- `pausedOwnerKeys` — CLEARED on open and on close (session-scoped intra-open).

**Origin tile behaviour during/after viewing**:
- At tap: `snapshotOrigin` reads `getBoundingClientRect`, computed
  `borderRadius`, poster URL, and resolves intrinsic media dims from
  `mediaItems` (falls back to `aspectRatio` if unknown).
- During: in `'expand'` mode the tile continues to render behind the overlay
  (opacity 1) — the FLIP clone is a separate `<img>` layer. In `'cut'` mode
  the overlay covers everything.
- On close: `originHostRegistry.get(borrow.ownerKey)` is consulted for
  live-tile borrow return. If the origin host is alive AND the viewport did
  NOT rotate, `VideoEngine.mountLane(borrow.laneId, originHost)` re-parents
  the `<video>` back into the tile — tile inherits playback continuity. If
  the host is gone OR viewport rotated → element parks in the hidden host
  (`unmountLane` + `pause`). Non-borrow closes leave the tile's own playback
  logic to resume.
- `prefers-reduced-motion`: `snapshotOrigin` returns `null`, disabling all
  FLIP transitions; overlay falls through to the plain opacity fade.

**Status-bar / chrome / body-scroll**:
- `lockBodyScroll` (ref-counted, composes with `CommentsSheetV2` stacking) on open.
- `document.body` gets class `route-fullscreen-overlay`, safe-area-shield background
  → transparent, `html/body` background → `#000000`.
- `setStatusBarStyleColor('dark', '00000000')` fires at TAP time inside
  `openWithOrigin` (before overlay mount) to kill the "strobe"; then
  `setStatusBarStyleColor('light', '00000000')` in the overlay's layout effect.
- Overlay flag is boot-locked via `ensureStatusBarOverlayBooted` (no async
  WebView resize during open).
- Cleanup: `unlockBodyScroll`, remove class, safe-area-shield stays transparent
  (NOT the light `#F8FAFC` — a light flash bug we removed), background rolled
  back, `applyRouteChrome(pathname, force=true)` re-resolves chrome for the
  returning route (Clubhouse dark notch/white icons vs Watch light notch/dark
  icons), and `VideoEngine.unmountLane('fullscreen')` parks the singleton and
  clears `firstFrame` before the next cold open snapshots it.

**Orientation**: `FullscreenImageSlot` and `FullscreenVideoSlot` both listen
for `visualViewport.resize` + `orientationchange` and re-run `resolveRestingRect`
while active. `BorrowedFullscreenSlot` computes a fresh resting rect at mount;
viewport rotation invalidates the borrow-return-to-origin path (parks to
hidden host instead).

---

## 4) Audio

**Session store** — `useSessionAudio` in `src/audio/sessionAudioStore.ts`
(referenced from chrome + overlay). Single source of truth: `isMuted` boolean.
`toggle()` / `unmute()` mutate it globally.

**Lane policies** — enforced in `returnBorrow` (see `FullscreenFeedOverlay.tsx:73-146`):
- **Rail lanes** (`laneId.startsWith('rail-')`) — always force-muted on return
  (rails are always muted by product rule).
- **Feed-active lane** — restores from the current session mute; unmute in the
  viewer travels back to the feed (comment B2 in `returnBorrow`). Explicitly
  NOT clobbered by a pre-borrow snapshot.

**Autoplay-blocked / TapForSoundPill** — `VideoEngine.onAutoplayBlocked`
subscription. When an unmuted `play()` is rejected and the viewer is open,
`showSoundPill = true`. Any unmute (pill, MuteButton, MediaPreviewViewer)
subscribes to `useSessionAudio` and clears it. Reset on close and on
`activeIndex` change.

**Viewer integration + known defect** (verbatim, from the mute button code
path): the fullscreen viewer's mute button drives `useSessionAudio.toggle()`
and the chrome shows the session's current `isMuted`. However, the video
lanes are muted/unmuted per-lane via `VideoEngine.setMuted(laneId, ...)`, and
the viewer does NOT synchronously push session state into the currently
active fullscreen/borrow lane at OPEN time — the lane's mute state is
inherited from whatever it was when acquired (rail = muted, feed-active =
last state). So if the session was `unmuted` but the tapped tile was a rail
lane (muted), opening the viewer inherits muted playback with the chrome
mute icon showing "muted"; the user must tap the mute button once to force a
`setMuted(false)` on the fullscreen/borrow lane. The wire is: session store
change → subscription in the chrome → NO active pushdown to the lane. Only a
subsequent toggle from the button reaches `VideoEngine`. On CLOSE the
opposite direction is now wired (`returnBorrow` re-applies session mute to
the feed-active lane).

---

## 5) Non-obvious dependencies

External to `src/components/fullscreen-feed/*` and `src/store/fullscreenFeedStore.ts`,
the following read viewer state or are wired to overlay lifecycle:

- **`engagementBus`** (`src/lib/engagementBus.ts`) — a global subscribe in
  `fullscreenFeedStore.ts:381-388` patches the in-viewer post snapshots on
  like/comment/follow deltas.
- **`applyEngagementDelta`** — same path, applied per post match.
- **`useIsViewerOwnedBy(surface)`** — used by `ExploreGrid`, `PostsTabContent`,
  `CourseMediaCanonGrid` to gate their own `appendPosts(...)` calls. Removing
  the store breaks these grids' pagination.
- **`useSetChromeSuppressed(isOpen)`** (`src/features/chrome-v2/leftOverride`) —
  hides the app's top-left/right chrome island while the viewer is open.
- **`applyRouteChrome`** (`src/lib/routeChrome.ts`) — called at cleanup with
  `force=true` because overlay open/close is not a route change.
- **`setStatusBarStyleColor` + `ensureStatusBarOverlayBooted`**
  (`src/hooks/useMedianStatusBar.ts`) — WebView status bar wire.
- **`lockBodyScroll` / `unlockBodyScroll`** (`src/lib/bodyScrollLock.ts`) —
  ref-counted; must compose with `CommentsSheetV2`.
- **`originHostRegistry`** (`src/video/originHostRegistry.ts`) — tiles register
  themselves so `returnBorrow('close')` can re-parent the live element home.
- **`RailLanePool`** (`src/video/railLanePool.ts`) — `pin`, `unpin({executeDeferred})`,
  `markReturning`, `clearReturning`, `laneFor`, `getCurrentTime`.
- **`feedLaneRoles`** (`src/video/feedLaneRoles.ts`) — `laneForRole('active')`,
  `roleForLane`, `freeze(lane)`, `unfreeze(lane, 'prev')`, `isFeedLane`.
- **`VideoEngine`** — the entire lane API: `snapshot(laneId)`, `isLivePlayable`,
  `markBorrowed`, `clearBorrowed`, `setMuted`, `setObjectFit`, `mountLane`,
  `unmountLane`, `pause({callerPostId, viaViewer})`, `play(...)`, `seek(...)`,
  `getLastPos`, `onAutoplayBlocked`.
- **`PrefetchController`** — `wasPrefetched(ownerKey)` for cold-route tracing.
- **Perf** — `vperf*` spans (`fs.open`, `fs.open:{postId}`, `fs.close`,
  `swipe.vertical`, `feed.activate`, `fs.open.motion`), `coldOpenRoute`,
  `coldOpenRevealSample`, `coldOpenIsActive`. Dashboards read these span
  names verbatim.
- **Trace** — `perfTrace('fsLane.at.open', ...)`, `perfTrace('origin.lost', ...)`,
  `traceRegisterOpen`, `traceGenId`, `traceLookup`, and the `[DECIDE]` /
  `[BORROW]` log stream (`isPerfEnabled`-gated). Device debugging depends on
  these event names.
- **`useReviewSheetStore`, `buildReviewSheetPayload`, `useReviewerStats`** —
  wired to the `read review ›` tap.
- **`useClubhouseLikes/Follows/Comments/Share` hooks** — shared with the inline
  feed; the overlay consumes them for actions.
- **`useActiveActor`, `useManageableBusinessIds`, `canManagePost`** — business
  actor gating for the action rail.
- **`useCourseRatingAggregates`** — fallback community rating for the top-right
  course chip.
- **Deep-link handler** — `src/pages/PostDeepLinkPage.tsx` opens the viewer
  directly with `openCommentsInitially` + `initialCommentId` + `onClose`
  (navigation-aware close). Notification tap flow routes here.
- **`InAppNotificationsMount` / `Activity` badge count** — unrelated to viewer
  BUT the deep-link post viewer is the terminal target of `notification.tap`
  intents from those systems.
- **`SnapFeed` reuse** — the same `SnapFeed` component powers the inline
  Clubhouse feed. Any deletion of the viewer must NOT delete `SnapFeed`.
  However the viewer relies on SnapFeed's `surface="fullscreen"` branch for
  lane selection, `isFullscreen` for chrome suppression, and `activeIndexOverride`
  for external active-index control.

Tests / admin tools: no dedicated test files were found for the fullscreen
overlay under `src/**/__tests__/` or `tests/`. No admin UI reads viewer state.

---

## 6) Known defects and workarounds baked into the current code

Enumerated from inline comments across the audited files — these are the ones
V2 should consciously fix or leave behind:

1. **Session-unmute doesn't push into the viewer on open** — §4. The user
   sees the correct icon state (session store) but the lane is still muted
   until they tap the mute button. Wire: no `setMuted(lane, session.isMuted)`
   call at open/mount for `fullscreen` or borrowed lane. On close the reverse
   direction now works via `returnBorrow`.
2. **iOS WKWebView degenerate `visualViewport` at overlay-mount tick** — the
   fullscreen "white screen" / "top-pinned sliver" regressions came from
   `visualViewport.height ≈ 0` at first read. Worked around by:
   (a) `getCurrentViewport()` clamping to `innerWidth/Height` when
   `vv.width|height < 100`, and (b) `FullscreenImageSlot` re-reading via
   `useLayoutEffect` + `visualViewport.resize` + `orientationchange`
   listeners (mirroring `FullscreenVideoSlot`).
3. **`origin` (store) transitioning non-null→null while open** — traced as
   `origin.lost`; can drop the FLIP clone mid-open. Instrumented but not
   fixed structurally; store.origin is set once at open and cleared at close.
4. **Stale `fs.open` perf span from a prior session** — cleared at open via
   `fsTimeEnd('open', '(stale open span discarded)')` + supersede path in the
   FLIP-clone effect (`vperfSupersede` if overlay closes before span settled).
5. **`firstFrame` never fires on borrow opens** — real-decode event doesn't
   fire for an already-decoded lane. Worked around by closing the `fs.open`
   span on the next rAF (`borrowBind`) and treating `playing` as a waypoint,
   not the closer. Otherwise every borrow orphaned to the 15s watchdog.
6. **`clubhouseStore.carouselPositions` lag on horizontal swipes in fullscreen**
   — produced a k>0 dead-tap bug on the scrubber. Fixed by moving the pager
   idx into the fullscreen store (`activePagerIdx`) and not consulting
   `clubhouseStore` in `FullscreenScrubber`.
7. **Vertical swipe on a borrow slide** — "borrow is one-shot property of the
   tap". `useEffect` in overlay demotes on any `activeIndex !== startIndex`
   change, plus a store one-shot flag (`borrowDemoteRequested`) for the
   first horizontal swipe on the borrow slide (Stage-7 PR-3).
8. **Rail lane re-acquire race** — on rail borrow return we do NOT execute
   the deferred pool release, because the tile will immediately re-acquire
   the same lane; tearing the source down blanks and reloads the tile.
9. **Overlay opacity 0.5 midpoint dim** — host opacity snaps to 1 (no
   transition) at reveal; only the clone crossfades. Prevents the 0.75×
   brightness mid-composite over `#000` even when pixels are identical.
10. **Clone teleport without a "from" style** — the FLIP uses render-A
    synchronous commit (clone at origin.rect, `targetRect null`) then a
    double-rAF before render-B (`targetRect` + `cloneExpanded`) so the
    browser has a real committed style to interpolate FROM.
11. **`fs.close` watchdog stall** — 500ms `setTimeout` backstop in
    `handleClose` always fires `signalCloseAnimDone` so the user is never
    trapped behind a stalled transition.
12. **Feed-active borrow rotation invariant** — while a feed-active lane is
    borrowed the physical lane is `feedLaneRoles.freeze(laneId)` to prevent
    role rotation over an in-use element; `unfreeze(..., 'prev')` on return.
13. **Empty-page skeleton flash** on cold `open([])` — mitigated by the
    skeleton shimmer for `posts.length === 0`; still visible on truly empty
    responses.
14. **Chrome not re-fired by AppRoutes on overlay close** — mitigated by the
    forced `applyRouteChrome(pathname, true)` at cleanup because overlay
    open/close is not a route change.
15. **`ChromeIsland` cross-account amber dot** — related fix in chrome-v2 that
    is now the reason the viewer must call `useSetChromeSuppressed(true)`
    (not delete-the-dot). Removing the viewer must not un-suppress the chrome
    island under it.
16. **`route-fullscreen-overlay` body class + safe-area-shield transparent**
    — must be paired; earlier bug painted `#F8FAFC` on the shield → light
    flash on close. Cleanup restores `transparent`, not the light default.
17. **The two direct-`open(...)` callers that bypass `openWithOrigin`** (loop
    tab, CourseMoments, PostDeepLinkPage) — origin is `null`, so they take
    the opacity-fade fallback and skip the FLIP entirely. V2 should keep an
    origin-less entry contract.

---

## 7) Performance budgets currently enforced

From `src/perf/vperf.ts` default budgets and inline overrides in
`openWithOrigin.ts`:

| Span kind | Budget (ms) | Set by | Ends on |
| --- | --- | --- | --- |
| `fs.open.borrow` (borrow open) | **150** | `vperfSetBudget(fsOpenSpanId, 150)` when `source==='borrow'` | rAF after storeOpen → `borrowBind`; `playing` is a later waypoint only |
| `fs.open.lane` (cold non-borrow video) | **500** | `vperfSetBudget(..., 500)` | Fullscreen lane `'firstFrame'` (`playing` is a later waypoint) |
| `fs.open.image` (image open) | **200** | `vperfSetBudget(..., 200)` | Clone `onTransitionEnd(transform)` → `settled` + `vperfEnd`; 500ms fallback in FLIP watchdog |
| `fs.close` | **250** (while `FS_TRANSITION_MODE==='cut'`) | Default in vperf | Borrow: rAF `handback` → rAF `tileLive`; non-borrow: rAF `tileLive` |
| `swipe.vertical` | **450** | Default in vperf | Lane `'firstFrame'` on `fullscreen` (viewer) or `feed-active` (inline); image slides skip |
| `feed.activate` | (see vperf defaults) | Started per activation | 900ms fallback close for image slides |
| `fs.open.motion` | Trace-only, bounded window | `vperfMotionTrace` on borrow opens only | Reports rects + viewport for jump diagnosis |

Reveal-gate watchdog (non-perf): FLIP clone has a 500ms `setTimeout` that
force-flips `motionComplete + childReady` if either the transitionend or
the video first-frame event stalls, then closes the `fs.open` span with a
`imageFallback` verdict.

Cold-open reveal sampler (`coldOpenRevealSample`): fires at t=0, +500ms,
+2000ms for cold non-borrow opens to diagnose whether the reveal gate is
stuck on `firstFrame` or on the swap logic.

---

## Intentionally droppable in a rebuild (flagged separately)

Items I would consciously NOT reimplement in V2, listed for the reconciliation
step — surface these before deleting anything:

- **`FS_TRANSITION_MODE = 'expand'` code path** — the entire FLIP forward clone,
  reverse clone, dual-clock reveal gate (motion + childReady), targetRect
  double-rAF, blur backdrop crossfade, and 500ms clone watchdog. Product
  currently ships `'cut'`; ~350 LOC of overlay logic and ~200 LOC in FeedSlide
  exist only for `'expand'`. Drop the constant, drop the branches.
- **The `[DECIDE]` / `[BORROW]` console log streams** and the
  `perfTrace('fsLane.at.open' | 'origin.lost')` device diagnostics — keep the
  vperf spans (dashboards depend on them), drop the console instrumentation.
- **`fsTimeStart/End/Event` no-op helpers** at the top of `FullscreenFeedOverlay`
  — dead code (all three are `() => {}`).
- **`clubhouseStore.carouselPositions` read in `ImmersiveFullscreenChrome`**
  for the dots — it lags the fullscreen pager (defect §6.6). Replace by
  reading `store.activePagerIdx` directly to match `FullscreenScrubber`.
- **The two loop-tab `store.open(allPosts, cardIndex)` sites without
  `openedFrom`** — leave the viewer without a surface tag (append-ownership
  becomes ambiguous). V2 should require `openedFrom` (or refuse to open).
- **`PostDeepLinkPage` bypass of `openWithOrigin`** — merge into one opener
  that accepts an origin-optional signature so the deep-link path shares the
  status-bar / resume / trace plumbing.

None of the seven behavioral areas above (entry contract, chrome, scrubber,
gestures, borrow lifecycle, session audio, perf budgets) is a drop candidate.
