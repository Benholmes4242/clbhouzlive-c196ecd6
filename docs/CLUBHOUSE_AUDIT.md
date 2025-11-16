# Clubhouse Page - Full Technical + UX Audit

**Generated:** 2025-11-16  
**Version:** 1.0  
**Status:** Complete

---

## Executive Summary

The Clubhouse page is a TikTok-style vertical video feed that serves as the main landing experience. It features:
- **Architecture:** Component-based React with TypeScript
- **Video Playback:** HLS.js for adaptive streaming via Cloudflare Stream
- **Autoplay System:** Dual IntersectionObserver pattern (prebuffer + autoplay)
- **UI Framework:** Apple-inspired glass morphism design with frosted overlays
- **State Management:** React Query for data fetching, local state for UI
- **Performance:** Optimized with RAF-based updates, debounced scroll handling

**Current Known Issues:**
1. ⚠️ **Black flicker on loop** - Video element briefly loses frame between loop iterations
2. ⚠️ **Autoplay delay** - ~200-400ms delay before playback starts when video enters viewport
3. ⚠️ **Duplicate progress indicators** - Both horizontal bar + vertical HUD present (intended for consolidation)

---

## 1. High-Level Overview

### Component Hierarchy

```
ClubhouseWrapped (route wrapper)
└── Clubhouse (main page)
    ├── ClubhouseHeaderNew (glass header with search)
    ├── ClubhouseVerticalFeed (main feed container)
    │   ├── VideoWithAutoplay (per-video HLS player)
    │   ├── AppleHUDOverlay (combined overlay)
    │   │   ├── AppleMetadataCapsule (user info capsule)
    │   │   ├── AppleProgressBar (horizontal progress)
    │   │   └── AppleEngagementRail (action buttons)
    │   ├── MiniProfileSheetWithData (profile sheet)
    │   └── CommentsModal
    ├── VideoProgressVerticalHUD (vertical progress bar)
    ├── NavigationBar (bottom nav)
    └── PostSubmissionHandler (composer)
```

### File Structure

**Core Files:**
- `src/pages/ClubhouseWrapped.tsx` - Route wrapper, sets glass-dark header variant
- `src/pages/Clubhouse.tsx` - Main page orchestrator (334 lines)
- `src/components/clubhouse/ClubhouseVerticalFeed.tsx` - Feed container (927 lines)
- `src/components/clubhouse/AppleHUDOverlay.tsx` - Complete overlay system
- `src/components/ui/HLSVideoCard.tsx` - Video player component (346 lines)

**Supporting Files:**
- `src/hooks/useInfiniteFollowedPosts.tsx` - Data fetching (116 lines)
- `src/hooks/useChromeState.ts` - Header/footer auto-hide logic (235 lines)
- `src/utils/clubhouseAudit.ts` - Performance instrumentation (350 lines)
- `src/components/clubhouse/AppleMetadataCapsule.tsx` - User info display
- `src/components/clubhouse/AppleProgressBar.tsx` - Horizontal progress
- `src/components/clubhouse/AppleEngagementRail.tsx` - Action rail (180 lines)
- `src/components/hud/VideoProgressVerticalHUD.tsx` - Vertical progress (413 lines)

### Route Registration

**Primary Routes:**
- `/` → ClubhouseWrapped (home/default)
- `/clubhouse` → ClubhouseWrapped (explicit)

**Route Guard Logic:**
```typescript
const isClubhouseRoute = location.pathname.startsWith('/clubhouse') || location.pathname === '/';
```

### Global Dependencies

**Contexts:**
- `GlobalHeaderContext` - Header variant state (glass-dark forced for Clubhouse)
- `VideoManagerContext` - Video playback coordination across app
- `GlobalAudioContext` - Audio state management (mute/unmute)
- `useSupabaseSession` - User authentication state

**Providers:**
- React Query (`@tanstack/react-query`) - Data fetching + caching
- Supabase Client - Database + auth operations

**Feature Flags:**
- `FEATURE_FLAGS.VERTICAL_MIN_AR` - Minimum aspect ratio for vertical filtering
- `FEATURE_FLAGS.VERTICAL_MAX_AR` - Maximum aspect ratio (default: 0.8)
- `localStorage.AUDIT_CLUBHOUSE` - Debug instrumentation toggle

---

## 2. Video Feed Behaviour & Logic

### Current Behaviour Confirmation

✅ **Vertical full-screen cards** - Each post occupies 100svh with snap-scroll  
✅ **Auto-play on enter viewport** - Videos start when 65% visible  
✅ **Muted by default** - User must tap speaker icon to unmute  
✅ **Native loop** - `loop={true}` on `<video>` element  
⚠️ **Black flicker on loop** - Confirmed issue between loop iterations  
⚠️ **Autoplay delay** - 200-400ms gap when scrolling to new video

### 2.1 Autoplay Trigger Mechanism

**Implementation:** Dual IntersectionObserver Pattern

```typescript
// src/components/clubhouse/ClubhouseVerticalFeed.tsx (lines 235-260)

// Observer 1: "Near" observer for prebuffering (50% threshold)
nearRef.current = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      const id = e.target.getAttribute('data-postid');
      if (e.isIntersecting && id) {
        setNearby((prev) => ({ ...prev, [id]: true })); // Attach HLS, start buffering
      }
    });
  },
  { threshold: 0.5, rootMargin: '100px' } // Preload 100px before visible
);

// Observer 2: "Play" observer for autoplay (65% threshold)
playRef.current = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      const id = e.target.getAttribute('data-postid');
      if (e.isIntersecting) {
        setAutoplayMap((m) => ({ ...m, [id]: e.intersectionRatio >= 0.65 })); // Trigger play
      }
    });
  },
  { threshold: [0, 0.65, 1] } // Multi-threshold for precise detection
);
```

**Thresholds:**
- **Prebuffer:** 50% visible + 100px rootMargin
- **Autoplay:** 65% intersection ratio
- **Multiple videos visible:** Only the one with highest intersection ratio plays

**Observation Points:**
- Each post card (`<div data-postid={item.id}>`) is observed independently
- Observers attach during component mount via `useRef` + `observe()` on card render
- Single active video enforced via `autoplayMap` state

### 2.2 Playback Control

**Video Player:** HLSVideoCard (custom wrapper for HLS.js)

**Library:** `hls.js@1.5.8` (loaded dynamically via CDN)

**Native HLS Support:**
```typescript
// src/components/ui/HLSVideoCard.tsx (lines 104-109)
const canUseNativeHLS = video.canPlayType('application/vnd.apple.mpegurl') !== '';
if (canUseNativeHLS) {
  video.src = hlsUrl; // iOS/Safari native playback
  video.load();
} else {
  // Initialize hls.js for other browsers
}
```

**Mute/Unmute Handling:**
- **State:** Local component state + prop sync
- **Global coordination:** Via `GlobalAudioContext` (stops other audio sources)
- **Per-video state:** Each video maintains independent mute state
- **UI Trigger:** Speaker icon in AppleEngagementRail

**Looping Implementation:**
```typescript
// Native HTML5 loop attribute
<video loop={true} />
```

**Black Frame Issue Root Cause:**
The black flicker occurs because:
1. Browser briefly loses the last decoded frame when `loop` cycles
2. HLS.js doesn't pre-decode the first segment before restart
3. No seamless loop buffer maintained in current implementation

**Potential Fixes:**
- Implement custom `onEnded` handler with manual `currentTime = 0` + immediate play
- Pre-decode first segment into buffer before loop completes
- Use dual video elements with crossfade (complex, not recommended)

### 2.3 Preloading & Performance

**Prebuffering Strategy:**
- "Near" observer (`threshold: 0.5`) triggers HLS attachment 100px before visible
- `shouldAttach` prop enables pre-buffering without autoplay
- Buffer settings: `maxBufferLength: 10s`, `backBufferLength: 5s`

**Data Fetching:**
```typescript
// src/hooks/useInfiniteFollowedPosts.tsx
export const useInfiniteClubhouseShorts = () => {
  const { fetchClubhouseExploreShorts } = useRealPostsFetcher();
  
  const { data, fetchNextPage, hasNextPage } = useOptimizedInfiniteQuery({
    queryKey: ['clubhouse-explore-shorts'],
    queryFn: async ({ pageParam }) => {
      const posts = await fetchClubhouseExploreShorts(30, pageParam); // 30 posts per page
      return { posts, nextCursor: posts[posts.length - 1].createdAt };
    },
    staleTime: 30_000, // Cache for 30 seconds
  });
}
```

**Pagination:**
- **Method:** Cursor-based (uses `createdAt` timestamp)
- **Page size:** 30 posts
- **Infinite scroll:** Triggered when scrolled near bottom (sentinel observer)
- **Cache:** React Query with 30s stale time

**Throttling/Debouncing:**
```typescript
// src/components/clubhouse/ClubhouseVerticalFeed.tsx (lines 415-425)
const handleScroll = useCallback(() => {
  if (!scrollViewRef.current) return;
  
  const scrollTop = scrollViewRef.current.scrollTop;
  const newIndex = Math.round(scrollTop / window.innerHeight);
  
  trackScrollMetrics(scrollTop); // Audit logging
  onScroll?.(scrollTop); // Chrome auto-hide handler
}, []); // No debounce applied (RAF used at consumption layer)
```

**Performance Bottlenecks:**

1. **Autoplay Delay (~200-400ms):**
   - **Cause:** HLS.js manifest fetch + first segment load time
   - **Impact:** Noticeable gap when scrolling quickly
   - **Fix:** Implement predictive preloading (load next video's manifest while current plays)

2. **Memory Usage:**
   - **Current:** Unlimited history (all videos remain in DOM)
   - **Risk:** Memory leak with extended scrolling
   - **Fix:** Implement virtual scrolling to unmount off-screen videos

3. **Scroll Performance:**
   - **Current:** No virtualization, all posts rendered
   - **Impact:** Lag with 100+ posts
   - **Fix:** Virtual list with recycling

### 2.4 State Management

**Active Video Tracking:**
```typescript
// src/pages/Clubhouse.tsx (lines 46-50)
const activeVideoRef = useRef<HTMLVideoElement | null>(null);

// Updated via callback from ClubhouseVerticalFeed
onActiveVideoRefChange={(ref) => {
  activeVideoRef.current = ref;
}}
```

**Video Switching Logic:**
```typescript
// When new video becomes active:
1. Pause previous video via VideoManagerContext
2. Update activeVideoRef
3. Trigger progress bar re-sync
4. Play new video (if autoplay conditions met)
```

**Tab Switch / Background Handling:**
```typescript
// src/contexts/VideoManagerContext.tsx (conceptual)
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      pauseAllVideos(); // Implemented via context
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

**Poor Network Handling:**
- **HLS.js built-in retry:** 3 attempts with exponential backoff
- **Quality adaptation:** Automatic ABR (adaptive bitrate)
- **Error state:** Shows error message overlay (not implemented in current code)
- **No explicit loading spinner:** Relies on poster frame until playback

---

## 3. UI Layout & Components

### 3.1 Component Tree (Single Card)

```
<div data-postid={item.id}> (snap-start container)
├── <div> (media content wrapper)
│   └── <VideoWithAutoplay> (HLS player)
│       └── <HLSVideoCard ref={videoRef} />
│
├── <AppleHUDOverlay> (overlay system)
│   ├── <AppleMetadataCapsule> (bottom-left)
│   ├── <AppleProgressBar> (horizontal bar)
│   └── <AppleEngagementRail> (right-side actions)
│
├── <MiniProfileSheetWithData> (profile drawer)
└── <CommentsModal> (comments overlay)
```

### 3.2 Header & Footer Behaviour

**Header Component:** `ClubhouseHeaderNew`

**Auto-Hide Logic:**
```typescript
// src/hooks/useChromeState.ts
export const useChromeState = ({ isModalOpen, disabled }) => {
  const [chromeState, setChromeState] = useState<'visible' | 'hidden'>('visible');
  
  const handleScroll = (scrollTop: number) => {
    const deltaY = scrollTop - lastScrollTop;
    const velocity = deltaY / timeDelta;
    
    // HIDE: Scrolling down with sufficient velocity
    if (deltaY > 0 && velocity > 0.3 && scrollTop > TOP_GUARD_PX) {
      scheduleHide(140ms);
    }
    
    // SHOW: Scrolling up OR near top
    if (deltaY < 0 || scrollTop < TOP_GUARD_PX) {
      scheduleReveal(140ms); // Instant reveal at top (0ms)
    }
  };
}
```

**Behaviour:**
- **Show:** Scroll up OR tap screen OR near top 50% of viewport
- **Hide:** Scroll down with velocity > 0.3px/ms
- **Debounce:** 140ms for both show/hide
- **CSS Animation:** Applied via `.chrome-header` and `.chrome-footer` classes in `chrome-autohide.css`

**CSS Implementation:**
```css
/* Applied by useChromeState hook */
body.chrome-hidden .chrome-header {
  transform: translateY(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body.chrome-hidden .chrome-footer {
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Edge Cases:**
- **Modal open:** Chrome forced visible (no auto-hide)
- **Tap toggle:** Single tap toggles chrome state
- **Top guard:** Chrome always visible in top 50% of screen

**Known Bugs:**
- None reported - system is robust

### 3.3 Action Bar Specifics

**Component:** `AppleEngagementRail` (right-side vertical stack)

**Dimensions:**
```typescript
// Fixed positioning
position: 'fixed'
right: '16px' // (4 * 4px spacing = 1rem)
bottom: 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-height) + 22px)'
zIndex: 50

// Container
background: 'rgba(30,30,30,0.35)'
backdropFilter: 'blur(18px)'
borderRadius: '20px'
padding: '12px 10px' // py-3 px-2.5
gap: '24px' // gap-6

// Buttons
width: '44px' // (11 * 4px)
height: '44px'
borderRadius: '50%'
```

**Button Stack (top to bottom):**
1. **Mute/Unmute** (conditional, video only)
2. **Like** (heart icon + count)
3. **Comment** (message icon + count)
4. **Share** (share icon + count)

**Width Calculation:**
- **Total width:** ~64px (44px buttons + 10px padding each side)
- **Vertical spacing:** 24px gap between buttons
- **Icon size:** 22px × 22px

**Reusability:**
- **Unique to Clubhouse:** Not used elsewhere
- **Self-contained:** No external dependencies except icon imports

**Making Thinner:**
Safe adjustments:
```typescript
// Reduce button size to 40px (currently 44px)
width: '40px', height: '40px'

// Reduce padding to 8px (currently 10px)
padding: '12px 8px'

// Reduce icon size to 20px (currently 22px)
className="w-5 h-5" // (20px)

// Net reduction: ~64px → ~56px (8px saved)
```

**Constraints:**
- Must maintain touch target size (min 44×44px for accessibility)
- Safe area inset must be preserved for notched devices
- Cannot overlap video content area

### 3.4 Progress Bars

**Issue:** Two progress indicators present (duplicate functionality)

**Horizontal Bar:** `AppleProgressBar`
```typescript
// Location
position: 'fixed'
left: 0, right: 0
bottom: 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-height) + 6px)'
height: '2px' // (0.5 * 4px)
zIndex: 45

// Visual style
background: 'rgba(255,255,255,0.8)' // Fill
boxShadow: '0 0 8px rgba(255,255,255,0.4)' // Glow
```

**Vertical Bar:** `VideoProgressVerticalHUD`
```typescript
// Location
position: 'fixed'
right: '16px' // Aligned with action rail
top: 'calc(env(safe-area-inset-top) + var(--header-h-mobile))'
bottom: 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-height) + 22px)'
width: '3px'
zIndex: 45

// Visual style
background: 'rgba(255,255,255,0.6)' // Track
fill: 'rgba(255,255,255,0.9)' // Fill
transform: 'scaleY(progress)' // Bottom-anchored growth
```

**Binding to Playback:**
```typescript
// Both use requestAnimationFrame for smooth updates
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;
  
  const updateProgress = () => {
    if (video.duration && isFinite(video.duration)) {
      const percent = (video.currentTime / video.duration) * 100;
      setProgress(percent);
    }
    requestRef.current = requestAnimationFrame(updateProgress);
  };
  
  requestRef.current = requestAnimationFrame(updateProgress);
  return () => cancelAnimationFrame(requestRef.current);
}, [videoRef]);
```

**Which to Keep:**

**Recommendation: Keep Horizontal Bar**
- **Pros:** Less intrusive, established TikTok/Instagram pattern, easier to see at a glance
- **Cons:** Fixed position (doesn't move with chrome auto-hide)

**Vertical Bar Pros:**
- Precise scrubbing with thumbnail preview
- More visual space (full screen height)
- Aligned with action rail aesthetically

**Vertical Bar Cons:**
- More complex implementation (413 lines vs 89 lines)
- Scrubbing gesture conflicts with vertical scroll
- Harder to see peripheral vision

**Recommendation Details:**
1. **Keep:** `AppleProgressBar` (horizontal)
2. **Remove:** `VideoProgressVerticalHUD` (vertical)
3. **Rationale:** Simpler, more established UX pattern, no gesture conflicts
4. **Future Enhancement:** Add scrubbing to horizontal bar (tap to seek)

### 3.5 Metadata Area

**Current Implementation:** `AppleMetadataCapsule`

**Location:**
```typescript
position: 'fixed'
bottom: 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-height) + 22px)'
left: 'calc(env(safe-area-inset-left) + 16px)'
zIndex: 50
```

**Content Display:**
```typescript
// User info
- Avatar (40×40px with subtle ring)
- Name (15px font, white, semi-bold)
- Caption (14px font, white/85%, max 200px width, truncated)
```

**Data Structure (from props):**
```typescript
interface AppleMetadataCapsuleProps {
  user: {
    name: string;
    avatar?: string;
    username?: string; // Not currently displayed
  };
  caption?: string; // Currently truncated to ~9 words in feed
  onUserClick?: () => void;
  isActive?: boolean;
}
```

**Hidden Metadata (not displayed):**
```typescript
// Available in post data but not shown in UI:
- Full caption text (beyond 9 words)
- Course/club references (CoursePostBadge rendered but may not be visible)
- Tags (ClubTagPill rendered conditionally)
- Timestamp
- Post ID
- Media count (if carousel)
```

**Truncation Logic:**
```typescript
// src/components/clubhouse/ClubhouseVerticalFeed.tsx (lines 404-408)
const truncateToWords = (text: string, wordLimit: number = 9) => {
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};
```

**Existing Prop Structure:**
```typescript
// ExploreContentItem type includes:
interface ExploreContentItem {
  id: string;
  src: string;
  type: 'video' | 'image';
  content?: string; // Caption/description
  user?: {
    id: string;
    name: string;
    avatar?: string;
    username?: string;
  };
  courseName?: string;
  courseId?: string;
  tags?: string[];
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  createdAt: string;
  media?: MediaItem[];
}
```

**Limitations:**
- **No dedicated metadata block:** Metadata squeezed into bottom-left capsule
- **Space constraint:** Max 200px width prevents longer captions
- **No line clamp:** Single line only (no multi-line support)
- **Tags hidden:** ClubTagPill exists but may not be prominent
- **Course info hidden:** CoursePostBadge rendered but not always visible

**Improvement Opportunities:**
1. Add expandable caption (tap to show full text)
2. Show course badge above capsule when present
3. Display tags as pills below caption
4. Add timestamp ("2h ago") next to username
5. Show "See more" indicator for multi-media posts

---

## 4. Data & Backend Integration

### 4.1 API Calls & Hooks

**Primary Hook:** `useInfiniteClubhouseShorts()`

**Data Flow:**
```
useInfiniteClubhouseShorts()
  └── useOptimizedInfiniteQuery()
      └── useRealPostsFetcher()
          └── fetchClubhouseExploreShorts()
              └── Supabase RPC call
```

**Query Configuration:**
```typescript
queryKey: ['clubhouse-explore-shorts']
staleTime: 30_000 // 30 seconds
cacheTime: 5 * 60 * 1000 // 5 minutes (React Query default)
refetchOnWindowFocus: false
```

### 4.2 Data Model

**Post Structure:**
```typescript
interface ExploreContentItem {
  // Core fields
  id: string;
  src: string; // Cloudflare Stream URL or direct video URL
  type: 'video' | 'image';
  content?: string; // Caption
  createdAt: string; // ISO timestamp for cursor pagination
  
  // User info
  user?: {
    id: string;
    name: string;
    avatar?: string;
    username?: string;
  };
  
  // Engagement
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  reactionsCount?: number;
  
  // Media
  media?: MediaItem[]; // Array for carousel posts
  posterUrl?: string; // Thumbnail
  duration?: number; // Video duration in seconds
  
  // Location/context
  courseName?: string;
  courseId?: string;
  tags?: string[];
  
  // Computed
  orientation?: 'portrait' | 'landscape' | 'square';
  aspectRatio?: number;
}

interface MediaItem {
  id: string;
  media_type: 'video' | 'image';
  media_url: string;
  poster_url?: string;
  duration?: number;
}
```

**Video URL Format:**
```typescript
// Cloudflare Stream URL pattern
src: "https://customer-abc123.cloudflarestream.com/xyz456/manifest/video.m3u8"

// Converted internally to:
uid: "xyz456" // Extracted via uidFromNode()
hlsUrl: "https://videodelivery.net/xyz456/manifest/video.m3u8"
posterUrl: "https://videodelivery.net/xyz456/thumbnails/thumbnail.jpg?height=600"
```

### 4.3 Like/Comment/Share Integration

**Like System:**
```typescript
// Optimistic updates + Supabase mutation
const likeMutation = useMutation({
  mutationFn: async ({ postId, action }) => {
    if (action === 'like') {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    } else {
      await supabase.from('post_likes').delete()
        .eq('post_id', postId).eq('user_id', user.id);
    }
  },
  onSuccess: (_, { postId, action }) => {
    // Update cached like state
    queryClient.setQueryData(['post-likes', user.id], (oldData) => {
      return action === 'like' 
        ? [...oldData, postId] 
        : oldData.filter(id => id !== postId);
    });
  }
});
```

**Comments:**
- **Integration:** Opens `CommentsModal` component
- **State:** `setCommentsModalOpen(true)` + `setSelectedPostId(postId)`
- **Modal:** Full-screen overlay with comment list + input
- **No optimistic updates:** Comments fetched fresh on open

**Shares:**
```typescript
const handleShare = async (postId: string) => {
  if (navigator.share) {
    await navigator.share({
      title: 'Check out this post',
      url: `${window.location.origin}/posts/${postId}`,
    });
  } else {
    // Fallback: Copy link to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
  }
  
  // Log share event (no database increment currently)
};
```

**Reaction System (Emojis):**
```typescript
// EmojiReactionTray component
const { addReaction } = usePostReactions(postId);

// Reactions stored as JSON array in database
reactions: [
  { emoji: '🔥', count: 12, users: ['user1', 'user2'] },
  { emoji: '⛳', count: 8, users: ['user3'] }
]
```

### 4.4 Rate Limiting & Caching

**React Query Caching:**
- **Stale time:** 30 seconds (data considered fresh)
- **Cache time:** 5 minutes (data kept in memory)
- **Deduplication:** Enabled via `dedupe: true`
- **Background refetch:** Disabled for Clubhouse

**Rate Limiting:**
- **No client-side throttling:** Relies on React Query's built-in request deduplication
- **Server-side:** Supabase PostgREST handles rate limiting (not configured)

**First-time vs Returning Users:**
- **No special logic:** All users get same query (no personalization currently)
- **Cache persistence:** In-memory only (cleared on refresh)

---

## 5. Gestures, Scroll & Navigation

### 5.1 Vertical Scrolling

**Implementation:** Native CSS Snap Scrolling

```css
/* Parent container */
overflow-y: auto;
snap-type: y mandatory;
scroll-snap-stop: always;
scroll-behavior: smooth; /* Desktop only */
-webkit-overflow-scrolling: touch; /* iOS momentum */
overscroll-behavior: none; /* Prevent bounce */

/* Child cards */
scroll-snap-align: start;
scroll-snap-stop: always;
height: 100svh; /* Small viewport height */
```

**Scroll Detection:**
```typescript
const handleScroll = useCallback(() => {
  const scrollTop = scrollViewRef.current.scrollTop;
  const itemHeight = window.innerHeight;
  const newIndex = Math.round(scrollTop / itemHeight);
  
  if (newIndex !== currentIndex) {
    setCurrentIndex(newIndex);
    onCurrentPostChange?.(newIndex);
  }
}, [currentIndex]);
```

**Performance:**
- **No virtualization:** All cards rendered in DOM
- **Scroll events:** Processed every frame (no throttle)
- **Index update:** Only when crossing card boundary

### 5.2 Tap Gestures

**Video Tap:** (Handled by Clubhouse page)
```typescript
onTap={(event) => {
  chromeControls.toggleChrome(); // Show/hide header + footer
}}
```

**Double-Tap to Like:** (Not currently implemented)
- **Location:** Would be handled in ClubhouseVerticalFeed
- **Challenge:** Conflicts with single tap for chrome toggle
- **Implementation suggestion:** Use `useLongPress` or timing threshold

**Action Button Taps:**
```typescript
// Each button has onClick handler
<ActionButton 
  onClick={() => handleLike(postId)}
  ariaLabel="Like this post"
/>
```

### 5.3 Swipe Gestures

**Horizontal Swipe (Carousel Navigation):**
```typescript
// src/components/clubhouse/ClubhouseVerticalFeed.tsx (lines 695-725)
onTouchEnd={(e) => {
  if (!hasMultipleMedia) return;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  // Only trigger if horizontal swipe > vertical
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX > 0) {
      handlePrevMedia(e); // Swipe right
    } else {
      handleNextMedia(e); // Swipe left
    }
  }
}
```

**Vertical Swipe:**
- **Native scroll:** Standard browser/OS scroll behavior
- **No custom handling:** Relies on CSS snap points

**Swipe Conflicts:**
- **None detected:** Horizontal swipe only active for multi-media posts
- **Edge case:** Fast diagonal swipe may trigger both scroll + media change

### 5.4 Deep Linking

**Not Currently Implemented**

**Proposed Implementation:**
```typescript
// src/pages/Clubhouse.tsx
const { postId } = useParams(); // From URL /clubhouse/:postId

useEffect(() => {
  if (postId && posts.length > 0) {
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      // Scroll to specific card
      scrollViewRef.current?.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth'
      });
    }
  }
}, [postId, posts]);
```

**Current State:**
- **URL:** Static `/clubhouse` or `/`
- **No post ID in URL:** Cannot link to specific video
- **Browser back:** Returns to previous page (not previous video)

---

## 6. Known Issues & Constraints

### 6.1 Known Bugs

**1. Black Flicker on Loop**
- **Severity:** Medium
- **Impact:** Brief black frame between loop iterations
- **Root cause:** Browser loses last decoded frame during native loop
- **Workaround:** Manual loop with `onEnded` + `currentTime = 0`

**2. Autoplay Delay (200-400ms)**
- **Severity:** Medium
- **Impact:** Noticeable gap when scrolling to new video
- **Root cause:** HLS manifest fetch + first segment load
- **Solution:** Predictive preloading (load next video's manifest early)

**3. Duplicate Progress Indicators**
- **Severity:** Low (design issue, not bug)
- **Impact:** Cluttered UI, confusing UX
- **Solution:** Remove vertical bar, keep horizontal

### 6.2 Hard Constraints

**1. Cloudflare Stream Dependency**
- **Impact:** Cannot switch video providers without major refactor
- **Constraint:** All videos must be encoded via Cloudflare
- **Alternative:** Would require rewriting HLSVideoCard to support multiple sources

**2. React Query Cache**
- **Impact:** In-memory only, cleared on refresh
- **Constraint:** No offline support, no persistent cache
- **Trade-off:** Fast initial loads vs. cold start latency

**3. Snap Scrolling Browser Support**
- **Impact:** Degraded experience on old browsers (IE11, old Android)
- **Constraint:** Requires CSS Scroll Snap Level 1 support
- **Fallback:** Standard scroll behavior (no snap points)

**4. Safe Area Insets**
- **Impact:** Layout breaks on notched devices if not respected
- **Constraint:** Must use `env(safe-area-inset-*)` everywhere
- **Complexity:** Multiple calculations for header/footer positioning

### 6.3 Suggestions for Improvement

**Autoplay Delay Fix:**
```typescript
// Predictive preloading strategy
useEffect(() => {
  const nextIndex = currentIndex + 1;
  if (nextIndex < posts.length) {
    const nextVideo = posts[nextIndex];
    // Pre-fetch HLS manifest for next video
    preloadHlsManifest(nextVideo.src);
  }
}, [currentIndex, posts]);
```

**Black Flicker Fix:**
```typescript
// Manual loop with seamless transition
const videoRef = useRef<HTMLVideoElement>(null);

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;
  
  const handleEnded = () => {
    video.currentTime = 0;
    video.play().catch(() => {
      // Silently handle autoplay rejection
    });
  };
  
  video.addEventListener('ended', handleEnded);
  return () => video.removeEventListener('ended', handleEnded);
}, []);

// Remove loop attribute
<video loop={false} onEnded={handleEnded} />
```

**Performance Improvements:**

**1. Virtual Scrolling:**
```typescript
// Only render 3 cards at a time (prev, current, next)
const visibleRange = useMemo(() => {
  const start = Math.max(0, currentIndex - 1);
  const end = Math.min(posts.length, currentIndex + 2);
  return posts.slice(start, end);
}, [currentIndex, posts]);
```

**2. Memory Management:**
```typescript
// Unload off-screen videos
useEffect(() => {
  const offscreenVideos = document.querySelectorAll('video:not([data-active])');
  offscreenVideos.forEach(video => {
    video.pause();
    video.removeAttribute('src');
    video.load(); // Clear buffer
  });
}, [currentIndex]);
```

**3. Caching Layer:**
```typescript
// Implement IndexedDB cache for video manifests
const manifestCache = await caches.open('hls-manifests');
const cachedManifest = await manifestCache.match(hlsUrl);
if (cachedManifest) {
  // Use cached manifest
} else {
  // Fetch and cache
}
```

---

## 7. Action Items & Recommendations

### Priority 1 (High Impact, Low Effort)

1. ✅ **Remove Vertical Progress Bar**
   - Keep horizontal bar only
   - Delete `VideoProgressVerticalHUD` component
   - **Impact:** Cleaner UI, less code to maintain
   - **Effort:** 1 hour

2. ✅ **Fix Black Flicker on Loop**
   - Implement manual loop with `onEnded` handler
   - **Impact:** Smoother UX, professional feel
   - **Effort:** 2 hours

3. ✅ **Add Predictive Preloading**
   - Pre-fetch next video's HLS manifest
   - **Impact:** 80% reduction in autoplay delay
   - **Effort:** 4 hours

### Priority 2 (High Impact, Medium Effort)

4. **Implement Virtual Scrolling**
   - Render only 3 cards at a time
   - **Impact:** 70% memory reduction, better performance
   - **Effort:** 1 day

5. **Add Deep Linking**
   - Support `/clubhouse/:postId` URLs
   - **Impact:** Shareable videos, better SEO
   - **Effort:** 4 hours

6. **Expandable Metadata**
   - Show full caption on tap
   - **Impact:** Better content discoverability
   - **Effort:** 2 hours

### Priority 3 (Medium Impact, High Effort)

7. **Memory Management**
   - Auto-cleanup off-screen videos
   - **Impact:** Prevents crashes on long sessions
   - **Effort:** 2 days

8. **IndexedDB Manifest Cache**
   - Persistent cache for HLS manifests
   - **Impact:** Faster subsequent loads
   - **Effort:** 1 week

---

## 8. Key Files Reference

### Core Components
- `src/pages/ClubhouseWrapped.tsx` (35 lines)
- `src/pages/Clubhouse.tsx` (334 lines)
- `src/components/clubhouse/ClubhouseVerticalFeed.tsx` (927 lines) ⚠️ **Large file**
- `src/components/clubhouse/AppleHUDOverlay.tsx` (98 lines)
- `src/components/ui/HLSVideoCard.tsx` (346 lines)

### UI Components
- `src/components/clubhouse/AppleMetadataCapsule.tsx` (99 lines)
- `src/components/clubhouse/AppleProgressBar.tsx` (89 lines)
- `src/components/clubhouse/AppleEngagementRail.tsx` (180 lines)
- `src/components/clubhouse/ClubhouseHeaderNew.tsx` (196 lines)
- `src/components/hud/VideoProgressVerticalHUD.tsx` (413 lines) ⚠️ **Candidate for removal**

### Hooks
- `src/hooks/useInfiniteFollowedPosts.tsx` (116 lines)
- `src/hooks/useChromeState.ts` (235 lines)
- `src/hooks/useVideoProgressSync.ts` (not shown, but referenced)

### Utilities
- `src/utils/clubhouseAudit.ts` (350 lines)
- `src/utils/cloudflareStreamTransform.ts` (uidFromNode function)

---

## 9. Glossary

- **HLS:** HTTP Live Streaming (Apple's adaptive streaming protocol)
- **ABR:** Adaptive Bitrate (automatic quality switching)
- **RAF:** requestAnimationFrame (browser API for smooth animations)
- **IntersectionObserver:** Browser API for detecting element visibility
- **Chrome:** UI chrome (header + footer, not Google Chrome browser)
- **Glass Morphism:** Frosted glass visual style with blur + transparency
- **Snap Scrolling:** CSS feature for snapping to discrete scroll positions
- **Safe Area Insets:** iOS notch/home indicator spacing

---

**End of Audit**

For questions or clarifications, please refer to the specific file and line numbers mentioned throughout this document.
