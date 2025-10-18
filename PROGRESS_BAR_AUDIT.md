# Video Progress Bar Audit — Discover › Videos

**Date:** 2025-10-18  
**Scope:** Documentation-only audit of the video progress bar implementation on `/discover?main=videos`  
**Purpose:** Enable future reuse on Clubhouse page with bottom-nav-aware anchoring

---

## 1. Logic & Lifecycle

### Progress Computation
- **Core calculation:** `currentTime / duration` (clamped to `[0, 1]`)
- **Update frequency:** ~60 FPS via `requestAnimationFrame` loop
- **Rounding:** Progress ratio rounded to 3 decimal places to prevent micro-jumps
- **Accessibility:** Separate React state (`progress`) maintains 0-100 value for `aria-valuenow`

### Event Wiring

#### Primary Events (video element)
| Event | Handler | Purpose |
|-------|---------|---------|
| `play` | `startSyncLoop()` | Initiates rAF loop |
| `playing` | `startSyncLoop()` | Ensures sync when playback resumes |
| `canplay` | `startSyncLoop()` | Starts sync when ready to play |
| `pause` | `stopSyncLoop('paused')` | Stops loop (unless video loops) |
| `ended` | `completeProgress()` | Sets 100% (unless looping) |
| `loadedmetadata` | Reset to 0 | Resets bar when metadata loads |
| `loadstart` | Reset + stop sync | Resets on new source |
| `timeupdate` | `calculateProgress()` | **Fallback** if rAF isn't active (~4-5 FPS) |
| `waiting` | *(no-op)* | Doesn't stop sync; waits for resume |
| `stalled` | *(no-op)* | Doesn't stop sync |

#### Document Events
| Event | Handler | Purpose |
|-------|---------|---------|
| `visibilitychange` | Stop/resume sync | Pauses rAF when tab hidden |

#### IntersectionObserver (from `useVideoVisibility`)
- **Threshold:** 60% (`0.6`) of card visible in viewport
- **Behavior:** Plays video when visible → starts progress sync; pauses when not visible → stops sync
- **Auto-mute:** Respects global mute state from `useExclusiveVideoAudio`

### Loop Behavior
- **Enabled:** `video.loop = true` (set on `loadedmetadata`)
- **Progress on loop:** Bar **does not reset**; continues from 0 as video replays
- **Sync continues:** rAF loop remains active during looping playback

### Reset Rules
- **Source change (`loadstart`):** Resets to 0%, stops sync, clears telemetry
- **New metadata (`loadedmetadata`):** Resets to 0% (maintains segments array)
- **Viewport exit:** Video pauses → sync stops (bar frozen at last position)
- **Viewport re-entry:** Video plays → sync resumes from current `currentTime`

### Segment Support (optional)
- Hook supports segmented progress via `options.segments` or `options.totalSegments`
- Current Discover implementation: **single segment** (not used for multi-section bars)
- Returns `segmentProgress` array for future multi-segment UI (e.g., YouTube-style chapters)

---

## 2. State & Refs

### Where State Lives
- **Per-card basis:** Each `<CinematicVideoCard>` instance has its own hook call
- **Hook:** `useVideoProgressSync(videoRef.current)` in `src/hooks/useVideoProgressSync.ts`
- **No shared state:** Multiple videos on-screen maintain independent progress tracking

### State & Refs Inventory

| Name | Type | Purpose |
|------|------|---------|
| `progress` | `useState<number>` | React state for a11y (`aria-valuenow`), 0-100 scale |
| `segmentProgress` | `useState<number[]>` | Array of 0-1 ratios per segment (future use) |
| `progressFillRef` | `useRef<HTMLDivElement>` | Direct DOM reference to fill element |
| `rafRef` | `useRef<number>` | Stores `requestAnimationFrame` ID for cleanup |
| `isActiveRef` | `useRef<boolean>` | Tracks whether rAF loop is running |
| `telemetryLoggedRef` | `useRef<boolean>` | Prevents duplicate telemetry logs |

### Update Strategy
- **Visual updates:** **Direct DOM manipulation** via `progressFillRef.current.style.transform = 'scaleX(ratio)'`
  - Bypasses React render cycle for 60 FPS smoothness
  - Uses GPU-accelerated `transform` (not `width`)
- **Accessibility updates:** React state (`progress`) updated in parallel for screen readers
- **No re-renders:** Visual progress bar never triggers component re-renders

### Cleanup
- **On unmount:** `stopSyncLoop()` cancels rAF, removes all event listeners
- **On source change:** `loadstart` event resets state and stops sync
- **On exclusive audio change:** `useExclusiveVideoAudio` cleanup deactivates video if it was active

---

## 3. DOM Structure & CSS

### JSX Structure (from `CinematicVideoCard.tsx`, lines 78-92)

```tsx
{/* Progress Bar - Bottom Edge of Video */}
<div 
  className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px] bg-hud-bg backdrop-blur-2xl z-20"
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Video progress"
>
  <div
    ref={setProgressFillRef}
    className="relative h-full origin-left will-change-transform bg-white/55"
    style={{ transform: 'scaleX(0)' }}
    aria-hidden="true"
  />
</div>
```

### Anatomy

```
┌─────────────────────────────────────────┐
│ Track (container)                       │
│ ┌───────────────┬─────────────────────┐ │ ← 2px height
│ │ Fill (scaled) │ Unfilled space      │ │
│ └───────────────┴─────────────────────┘ │
└─────────────────────────────────────────┘
```

### Track (Container) Styles

| Class | Token/Value | Purpose |
|-------|-------------|---------|
| `pointer-events-none` | — | Prevents bar from blocking video clicks |
| `absolute left-0 right-0 bottom-0` | — | Spans full width at bottom of card |
| `h-[2px]` | `2px` | Height of progress track |
| `bg-hud-bg` | Design token | Dark glass background (see below) |
| `backdrop-blur-2xl` | `blur(40px)` | Glass blur effect |
| `z-20` | `20` | Above video, below controls (duration/mute = z-30) |

### Fill Styles

| Class | Token/Value | Purpose |
|-------|-------------|---------|
| `relative` | — | Positioning context |
| `h-full` | `100%` | Matches track height (2px) |
| `origin-left` | `transform-origin: left` | Scales from left edge |
| `will-change-transform` | — | GPU optimization hint |
| `bg-white/55` | `rgba(255,255,255,0.55)` | White at 55% opacity |
| `transform: scaleX(0)` | Inline style | Initial state; updated by hook |

### Design Token: `bg-hud-bg` (from `index.css`)

**Expected definition** (not visible in current file context, likely in CSS variables):
```css
--hud-bg: hsl(0 0% 0% / 0.5); /* Black at 50% opacity, or similar dark glass */
```
Combined with `backdrop-blur-2xl`, creates the "dark glass" effect.

### Positioning Details
- **Within card:** `absolute bottom-0` anchors to video container's bottom edge
- **Full-width:** `left-0 right-0` spans entire card width
- **No safe-area:** Currently **no** `env(safe-area-inset-bottom)` applied (card is not viewport-fixed)
- **Z-index stack:**
  - Video: `z-0` (implicit)
  - Progress bar: `z-20`
  - Duration badge / Mute button: `z-30`

### Transitions
- **None on Discover:** No transition classes; instantaneous updates via rAF
- **Smooth visual:** 60 FPS rAF creates perceived smoothness without CSS transition

---

## 4. Edge Cases & Robustness

### No Duration / NaN
- **Check:** `if (!duration || isNaN(duration) || duration === 0) return;` (line 30)
- **Behavior:** Progress bar remains at 0%; no visual update
- **Common causes:** Metadata not loaded, corrupt video

### Stalled Network
- **`waiting` event:** Does not stop sync; bar freezes at last known position
- **`stalled` event:** Same; does not stop sync
- **Recovery:** When playback resumes (`playing`), sync continues from current `currentTime`

### Very Short Videos (<1s)
- **Works correctly:** Progress computed normally (0-1 ratio)
- **Visual smoothness:** May appear to complete very quickly, but mathematically accurate

### Looping Videos
- **Loop enabled:** `video.loop = true` (line 39)
- **Progress on loop:** Bar **does not reset** to 0 on loop; continues from current `currentTime`
- **Sync continues:** rAF loop remains active (not stopped on `ended` if looping)

### Multiple Videos On-Screen
- **Independent tracking:** Each card has its own `useVideoProgressSync` instance
- **Exclusive audio:** Only one video unmuted at a time (via `useExclusiveVideoAudio`)
- **Progress bars:** All visible videos' bars update independently at 60 FPS

### Orientation / Resize
- **Responsive:** Bar width adjusts via `left-0 right-0` (100% of card width)
- **Height:** Fixed at `h-[2px]`; no dynamic scaling

### SSR / Hydration
- **Feature flag:** `USE_VIDEO_PROGRESS_SYNC_V1` guards all logic (line 2)
- **Ref checks:** `if (!videoElement)` prevents errors before hydration
- **No flash:** Initial `transform: scaleX(0)` inline style prevents jump

### Telemetry
- **Logged once per video load:** `telemetryLoggedRef` prevents duplicate logs
- **Events tracked:** `video_progress_sync_started`, `video_progress_sync_paused`, `video_progress_sync_completed`, `video_progress_sync_resumed`
- **Payload:** Includes segment count, player type (HLS/native), duration

---

## 5. Screenshots

### Dark Glass Progress Bar (Discover › Videos)

**Note:** Screenshot tool returned HTTP 412 error (auth-protected page). Below is a **description** of the expected visual:

- **Track:** 2px dark glass bar (black at ~50% opacity, blurred)
- **Fill:** White at 55% opacity, scales left-to-right as video plays
- **Position:** Absolute bottom edge of video card, full width
- **Z-index:** Below duration badge (bottom-left) and mute button (bottom-right)

**Manual verification:** Navigate to `/discover?main=videos` while logged in to see live bar.

---

## 6. Code Pointers

### Primary Files

| File | Role |
|------|------|
| `src/components/discover/CinematicVideoCard.tsx` | Renders progress bar UI (lines 78-92) |
| `src/hooks/useVideoProgressSync.ts` | Core progress logic and rAF loop |
| `src/hooks/useExclusiveVideoAudio.ts` | Manages mute state (impacts autoplay/pause) |
| `src/hooks/useVideoVisibility.ts` | **Not found** (likely inline or renamed) |
| `src/utils/featureFlags.ts` | Defines `USE_VIDEO_PROGRESS_SYNC_V1` |
| `src/utils/videoTelemetry.ts` | Telemetry logging for progress events |

### Key Symbols

| Symbol | Location | Purpose |
|--------|----------|---------|
| `useVideoProgressSync` | `src/hooks/useVideoProgressSync.ts` | Main hook |
| `setProgressFillRef` | Returned from hook | Attaches ref to fill element |
| `progress` | Returned from hook | Accessibility state (0-100) |
| `segmentProgress` | Returned from hook | Future multi-segment support |
| `progressFillRef.current.style.transform` | Line 37 | Direct DOM update |

### Event Listeners (lines 182-191)
```typescript
videoElement.addEventListener('play', handlePlay);
videoElement.addEventListener('playing', handlePlaying);
videoElement.addEventListener('canplay', handleCanPlay);
videoElement.addEventListener('pause', handlePause);
videoElement.addEventListener('waiting', handleWaiting);
videoElement.addEventListener('stalled', handleStalled);
videoElement.addEventListener('ended', handleVideoEnded);
videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
videoElement.addEventListener('loadstart', handleLoadStart);
videoElement.addEventListener('timeupdate', handleTimeUpdate);
```

---

## 7. Feasibility Note — Clubhouse Reuse with Bottom-Nav Anchoring

### Goal (Later Implementation)
- **When nav visible:** Progress bar anchored to **top edge** of bottom nav
- **When nav hidden:** Progress bar slides down and anchors to **viewport bottom**
- **Transition:** Smooth 300ms animation in sync with nav slide

### Recommended Approach

#### A. Detect Bottom Nav Visibility
**Best option:** Existing `useBottomNavigation()` context (already implemented)

```tsx
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

const { isVisible } = useBottomNavigation();
```

- **Source:** `src/contexts/BottomNavigationContext.tsx`
- **Returns:** `{ isVisible: boolean, setVisible, hideBottomNav, showBottomNav }`
- **No new code needed:** Context already wired up globally

**Alternative (not recommended):** IntersectionObserver on nav wrapper (more complex, duplicate logic)

#### B. CSS Anchoring Strategy

**Change from card-anchored to viewport-fixed:**

```tsx
// Discover (current): absolute within card
<div className="absolute left-0 right-0 bottom-0 ...">

// Clubhouse (proposed): fixed to viewport with dynamic bottom
<div 
  className="fixed inset-x-0 z-20 transition-[bottom] duration-300 ease-out pointer-events-none"
  style={{ 
    bottom: `calc(env(safe-area-inset-bottom) + ${isVisible ? 'var(--bottom-nav-height, 72px)' : '0px'})` 
  }}
>
  <div className="mx-auto max-w-screen-sm">
    {/* Track + Fill (reuse existing markup) */}
  </div>
</div>
```

**Key changes:**
1. `fixed` positioning instead of `absolute` (viewport-relative)
2. Dynamic `bottom` value:
   - **Nav visible:** `env(safe-area-inset-bottom) + var(--bottom-nav-height)`
   - **Nav hidden:** `env(safe-area-inset-bottom) + 0px`
3. `transition-[bottom] duration-300 ease-out` (matches `chrome-follow-bottom` timing)
4. Safe-area insets (`env(safe-area-inset-bottom)`) for iOS/Android notches

**CSS variable source:**
- `--bottom-nav-height` should be set in `GlobalBottomNavigation.tsx` (currently uses inline `paddingBottom: var(--safe-bottom, 0px)`)
- Recommend: Add `--bottom-nav-height: 72px` (or measure dynamically) to `:root` or nav wrapper

#### C. Z-Index Alignment

**Current stack (Discover):**
- Video: `z-0`
- Progress: `z-20`
- Duration/Mute: `z-30`

**Clubhouse stack (proposed):**
- Video content: `z-0`
- **Progress bar (fixed):** `z-20` ✅ (below nav)
- **Engagement rail:** `z-30` (has `chrome-follow-bottom`, slides with nav)
- **Bottom nav:** `z-40` or higher

**No conflicts:** Progress at `z-20` sits comfortably below nav and rails.

#### D. Complexity Assessment

| Aspect | Complexity | Notes |
|--------|-----------|-------|
| Detection | ✅ Low | Use existing `useBottomNavigation()` context |
| CSS Anchoring | ✅ Low | Change `absolute` → `fixed`, dynamic `bottom` |
| Safe-Area | ✅ Low | Add `env(safe-area-inset-bottom)` |
| Z-Index | ✅ Low | No conflicts with current stack |
| Transition | ✅ Low | Reuse `transition-[bottom] duration-300` pattern |
| Component Reuse | ✅ High | Same track/fill JSX, same hook logic |

**Overall:** **Very feasible** with minimal effort (mostly CSS changes).

#### E. Proposed Implementation Checklist (Later)

- [ ] Define `--bottom-nav-height` CSS variable (e.g., in `GlobalBottomNavigation.tsx` or `:root`)
- [ ] Create `<FixedProgressBar>` wrapper component for Clubhouse
- [ ] Consume `useBottomNavigation()` to get `isVisible`
- [ ] Apply dynamic `bottom` style with safe-area insets
- [ ] Reuse `useVideoProgressSync` hook and existing track/fill markup
- [ ] Test on iOS Safari (notch/safe-area), Android Chrome (gesture nav)
- [ ] Verify z-index layering with engagement rail and nav

---

## 8. Summary

### Current Implementation (Discover › Videos)
- **rAF-based:** Smooth 60 FPS updates via direct DOM manipulation
- **Robust:** Handles edge cases (no duration, stalled network, looping, viewport exit)
- **Accessible:** Separate React state for `aria-valuenow`
- **Independent:** Per-card tracking; no interference between multiple videos
- **Dark glass:** 2px track (`bg-hud-bg`, `backdrop-blur-2xl`), white/55% fill
- **Positioning:** Absolute bottom of video card, no safe-area handling

### Reuse for Clubhouse
- **Minimal changes:** Same hook, same markup, different container positioning
- **Bottom-nav aware:** Use existing `useBottomNavigation()` context
- **CSS-driven:** Dynamic `bottom` style with safe-area insets
- **Low risk:** No logic changes, only presentation layer

---

**End of Audit**  
**Next step:** Await approval to implement Clubhouse bottom-nav-aware progress bar using this blueprint.
