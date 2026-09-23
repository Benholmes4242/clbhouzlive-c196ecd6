# Canvas Stage 2C — Image grounds

## Goal
Move the nine identified media grounds and missing-image fallbacks onto the canonical dark ramp without changing photography, amber/status colours, motion, sizing, or media behaviour.

## Implementation

### 1. Correct the map contract comment
- Change the `darkMode` JSDoc in `src/config/maps.ts` to say its actual default is `true`.
- Confirm all three current callers use the default dark path and pass no `landColor`, `waterColor`, or `darkMode` override.
- Leave the light overrides unchanged in this stage, but report that they are currently unreachable and no longer needed by any current caller.

### 2. Media grounds → Canvas
Import `PAGE_CANVAS` by reference and replace only the base/matte colour in:
- `src/components/feed/SnapVideoPlayer.tsx` — player chassis and solid letterbox fallback.
- `src/components/feed/InlineVideo.tsx` — base beneath poster and video.
- `src/components/feed/FeedImageCarousel.tsx` — non-fullscreen image matte.
- `src/components/feed/FeedSlide.tsx` — poster/image slot mattes.
- `src/components/feed/VideoProcessingCard.tsx` — non-overlay processing ground; preserve the existing translucent overlay wash.

Inspect and document layered cases rather than flattening them: `SnapVideoPlayer` keeps both blurred-poster layers plus vignette and edge scrim above Canvas; fullscreen `FeedImageCarousel` keeps its blurred-poster layer; `FeedSlide` keeps poster/processing overlays above Canvas.

### 3. Missing-image fallbacks → Panel/Cell
Import `MEMBER_PANEL` and `MEMBER_CELL` by reference and preserve every gradient direction and stop position in:
- `src/lib/avatarFallback.ts` — canonical member/profile-photo gradient.
- `src/components/ui/CoverPhotoFallback.tsx` — profile cover fallback.
- `src/components/explore-tab-new/courseled/CourseImageFallback.tsx` — all deterministic course fallback directions, including the flat hero-empty state.
- `src/components/whs/CourseImageFallback.tsx` — WHS course fallback.

Use only Panel and Cell token references for gradient colour stops so the two tiers cannot drift. Keep initials, motifs, opacity, hashing/API shape, image loading, and real photography unchanged.

### 4. Guards and report
- Extend the existing canvas token test with focused source guards for all nine owners, including no remaining pre-ramp media fills or fallback gradient colours in those files.
- Preserve the existing map and light-canvas independence assertions.
- Report every changed surface and rationale, every layered media stack, current reachability of the map light defaults, and remaining canvas clashes outside these nine owners. Do not alter charts or admin.

## Verification
- Run the focused canvas surface tests, then the existing test suite and separate any unrelated known failures.
- Open an authenticated feed with real image and video posts, confirming loading/contain mattes merge into Canvas and layered blurred surrounds remain visible.
- Open a reachable profile with no profile or cover photo and confirm the Panel→Cell fallbacks render correctly.
- If the external unmanaged Supabase session prevents authenticated checks, verify public/reachable states and name each unverified screen explicitly.
