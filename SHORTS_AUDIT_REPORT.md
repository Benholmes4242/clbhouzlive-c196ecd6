# Shorts Meta Audit Report — /discover?main=shorts

**Generated:** 2025-10-21  
**Scope:** Everything below Clubhouse Live strip on `/discover?main=shorts`  
**Status:** ✅ Complete baseline audit

---

## 1. Component Map

### Core Components

| Component | File Path | Purpose |
|-----------|-----------|---------|
| `ShortsGrid` | `src/components/discover/ShortsGrid.tsx` | Grid container, masonry layout, infinite scroll |
| `ShortCardWithObserver` | `src/components/shorts/ShortCardWithObserver.tsx` | Wrapper with IntersectionObserver for autoplay control |
| `ShortCard` | `src/components/shorts/ShortCard.tsx` | Individual card rendering (video + meta) |
| `ShortsViewer` | `src/components/shorts/ShortsViewer.tsx` | Fullscreen swipeable viewer (lazy loaded) |
| `LiveClubhouseStrip` | `src/components/shorts/LiveClubhouseStrip.tsx` | Horizontal strip above grid |
| `DiscoverContent` | `src/components/discover/DiscoverContent.tsx` | Parent content router |

### Props Contracts

#### ShortsGrid
```typescript
interface ShortsGridProps {
  items: ExploreContentItem[];       // From useInfiniteExploreContent
  onOpen: (item: ExploreContentItem) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}
```

#### ShortCard (Current Implementation)
```typescript
interface ShortCardProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;           // Dynamic: 252-308px via masonry
  isPinned?: boolean;         // First 2 cards fixed at 280px
  autoplay?: boolean;         // Controlled by IntersectionObserver
}
```

#### ExploreContentItem (Data Shape)
```typescript
{
  id: string;
  type: 'video' | 'image';
  src: string;                // Video URL
  title: string;              // Caption text
  likes: number;
  thumbnailSrc?: string;      // Poster image
  user?: {
    id: string;
    name: string;             // Creator name
    username?: string;
    avatar: string;           // 28×28 currently
    verified?: boolean;
  };
  durationSeconds?: number;
}
```

---

## 2. DOM & CSS Redlines (Current State)

### ShortCard Layout — Lines 74-103 in ShortCard.tsx

```
┌─────────────────────────────┐
│  [Video/Image 9:16 ratio]   │ ← Container: rounded-xl, shadow
│  with poster fallback        │ ← Height: 280px (pinned) or 252-308px (masonry)
│                              │
│  + gradient overlay          │
│  + hover scale 105%          │
└─────────────────────────────┘
  ↓ 6px gap (mt-1.5)
┌─────────────────────────────┐
│ [Title] (15px semibold)      │ ← line-clamp-1, text-foreground
└─────────────────────────────┘
  ↓ 2px gap (mt-0.5)
┌─────────────────────────────┐
│ [Avatar 20px] [Username]  ♡ 264 │ ← 13px, muted-foreground
└─────────────────────────────┘
```

### Current Values (Computed from ShortCard.tsx)

| Element | Property | Value | Location |
|---------|----------|-------|----------|
| **Card Container** | Border radius | `12px` | `.rounded-xl` (line 30) |
| | Shadow | `0 1px 2px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.06)` | Inline style (line 39) |
| | Height | `280px` (pinned) / `252-308px` (masonry ±10%) | Lines 18-22 in ShortsGrid.tsx |
| | Aspect ratio | `9:16` | Line 38 |
| | Hover scale | `1.05` | Line 48 |
| **Title** | Font size | `15px` | `text-[15px]` (line 76) |
| | Font weight | `600` (semibold) | `font-semibold` |
| | Line clamp | `1` | `line-clamp-1` |
| | Color | `hsl(var(--foreground))` | `text-foreground` |
| | Margin top | `6px` | `mt-1.5` (line 74) |
| **Meta Container** | Margin top | `2px` | `mt-0.5` (line 81) |
| | Font size | `13px` | `text-[13px]` |
| | Color | `hsl(var(--muted-foreground))` | `text-muted-foreground` |
| **Avatar** | Size | `20×20px` | Line 88 |
| | Border radius | `50%` (circle) | OptimizedAvatar component |
| | Gap to name | `6px` | `gap-1.5` (line 83) |
| **Username** | Font weight | `500` (medium) | `font-medium` (line 92) |
| | Max width | None (can overflow) | ⚠️ No truncation |
| | Overflow | Visible | ⚠️ Can break layout |
| **Like Button** | Icon size | `14×14px` | `w-3.5 h-3.5` (line 98) |
| | Gap to count | `4px` | `gap-1` |
| | Touch target | **⚠️ ~18×18px (too small)** | No min-width/height |
| **Column Gutter** | Gap | `4px` | `gap-1` (line 39 in ShortsGrid) |
| **Row Spacing** | First row gap | `8px` | `mb-2` (line 127 in ShortsGrid) |
| | Column internal | `8px` | `gap-2` (lines 145, 158) |

### ⚠️ Current Issues vs Target Spec

| Issue | Current | Target |
|-------|---------|--------|
| Avatar size | 20px | **28px** |
| Avatar ring | None | **1px ring (#6E9277 when yours)** |
| Username style | font-medium (500) | **font-semibold (600), color: #6E9277** |
| Username truncation | None (can overflow) | **fade mask at 60% width** |
| Like button target | ~18×18px | **44×44px minimum** |
| Caption display | Above meta (title) | **Below meta as 2-line with fade** |
| Caption truncation | line-clamp-1 (title) | **line-clamp-2 with gradient fade** |
| Author clickable | ❌ No | **✅ Opens profile** |
| Like toggle | ❌ No | **✅ Optimistic update** |

---

## 3. Behavior Inventory

### Current Interactions

| Action | Behavior | Status |
|--------|----------|--------|
| **Card tap** | Opens `ShortsViewer` fullscreen | ✅ Working |
| **Avatar tap** | No action | ❌ Missing |
| **Username tap** | No action | ❌ Missing |
| **Like tap** | No action | ❌ Missing |
| **Scroll** | Infinite load at -800px from bottom | ✅ Working |
| **Autoplay** | Starts at 65% visibility (IntersectionObserver) | ✅ Working |

### Truncation Behavior

- **Title**: Single line with ellipsis (`line-clamp-1`)
- **Username**: No truncation ⚠️ (can break layout on long names)
- **Caption**: Not implemented yet

### Like Count Formatting

```typescript
// Current: Uses browser's toLocaleString()
{item.likes.toLocaleString()}  // Line 99 in ShortCard.tsx

// ✅ Good: 1,234 → "1,234"
// ⚠️ Issue: 12,345 → "12,345" (5 chars, can shift layout)
// ❌ Missing: No k/M formatter (12.3k)
```

### Skeletons

**Status:** ❌ Not implemented  
No skeleton states exist. Shows spinner during load.

---

## 4. Performance Traces

### Load Metrics (from console logs)

```
⚠️ Page load time: 14,899ms
DOM Content Loaded: 14,884ms
Load Complete: 14,899ms
First Contentful Paint: N/A
```

**Analysis:**
- Very slow initial load (14.9s)
- Missing FCP measurement
- Likely due to waterfall requests and large bundle

### Video Loading Pattern

```
[Timeline from session replay]
1761046909625: Initializing video player (Short 1)
1761046911422: Initializing video player (Short 2)  ← 1.8s gap
1761046914287: Initializing video player (Short 3)  ← 2.9s gap
1761046914787: Initializing video player (Short 4)  ← 0.5s gap
```

**Analysis:**
- Sequential loading (not parallel)
- Staggered initialization causes visual pop-in
- No preloading detected for below-fold cards

### Poster Preloading (ShortsGrid.tsx lines 32-46)

```typescript
useEffect(() => {
  const firstItems = items.slice(0, 6);  // ✅ Good: Preload first 6
  firstItems.forEach(item => {
    const streamId = getStreamIdFromUrl(item.src);
    const posterUrl = getStreamPoster(streamId, '0s', 720);
    if (posterUrl) {
      const img = new Image();
      img.src = posterUrl;  // Fire-and-forget preload
    }
  });
}, [items]);
```

**Status:** ✅ Implemented, but:
- No `loading="eager"` or `fetchpriority="high"` hints
- No decoded hints
- 720p resolution (could be 480p for thumbnails)

### Scroll Performance

**From session replay:**
- Frequent DOM mutations (lc-dot elements added/removed)
- No visible jank reported, but long load time suggests heavy paint

**Missing:**
- Chrome Performance recording (not captured)
- React Profiler data (not instrumented)
- Layout thrash metrics

---

## 5. Data Flow & Re-render

### Hook Chain

```
Discover.tsx (line 72-77)
  ↓ useInfiniteExploreContent(FILTER_TYPES.VIDEOS, undefined, getDurationFilter('shorts'))
    ↓ Fetches from useRealPostsFetcher → fetchRealPosts()
      ↓ Returns ExploreContentItem[]
        ↓ DiscoverContent.tsx (line 160-166)
          ↓ ShortsGrid
            ↓ ShortCardWithObserver (wraps ShortCard)
```

### State Management

| State | Location | Trigger |
|-------|----------|---------|
| `items[]` | ShortsGrid props | Parent updates from infinite load |
| `visibleCards Set` | ShortsGrid (line 29) | IntersectionObserver callbacks |
| `viewerOpen` | ShortsGrid (line 27) | Card click |
| `autoplay` | ShortCardWithObserver | IntersectionObserver (65% threshold) |

### Re-render Triggers

**On scroll:**
1. IntersectionObserver fires for cards entering/leaving viewport
2. `onVisibilityChange` callback (line 58-68 in ShortsGrid)
3. Updates `visibleCards` Set
4. **⚠️ Potential issue:** Set update triggers re-render of entire ShortsGrid

**On like toggle (NOT IMPLEMENTED YET):**
- Will require optimistic update in parent state
- Must avoid re-rendering all cards (use React.memo on ShortCard)

### N+1 Query Risks

**Status:** ✅ Safe  
- User data is embedded in `ExploreContentItem.user`
- No per-card fetching detected
- Posters are derived from video URL (getStreamPoster util)

---

## 6. Assets & Loading

### Video URLs

Pattern: `https://customer-4ah4gni80ytefpck.cloudflarestream.com/{streamId}/manifest/video.m3u8`

**Examples from logs:**
- `668faa08e29ae164765353e6477bc286`
- `c0f64ee142ae57031f3a0d2d1b37c9c8`

### Poster Generation (stream.ts util)

```typescript
getStreamPoster(streamId, '0s', 720)
// Returns: https://customer-4ah4gni80ytefpck.cloudflarestream.com/{streamId}/thumbnails/thumbnail.jpg?time=0s&height=720
```

**Current:**
- ✅ Consistent pattern
- ⚠️ No `loading="lazy"` on video elements (line 44-54 in ShortCard.tsx)
- ⚠️ No `fetchpriority` hints
- ⚠️ No `decoding="async"` on posters

### Avatar Loading

```typescript
<OptimizedAvatar
  src={item.user.avatar}
  size={20}  // Currently 20px, should be 28px
  fallback={item.user.name?.[0]}
/>
```

**Status:** ✅ Lazy loading likely handled by OptimizedAvatar component

---

## 7. Edge Cases (Documentation)

### Long Username

**Current behavior:** No truncation, can push like button off-screen

**Example:**
```
[Avatar] ThisIsAVeryLongUsernameWithNoSpaces123  ♡ 1.2k
         ^^^^^^^^^^^^^^^^^^^^^ Overflows ^^^^^^^^^^^
```

**Fix needed:** Max-width 60% with fade mask

### Empty Caption

**Current:** Shows title as single line (line 76-78)  
**Target:** Show empty state or omit caption block entirely

### Emoji-Only Caption

**Current:** Renders normally  
**Target:** Should still use 2-line clamp with fade

### Like Count ≥ 10k

**Current:** `12345` → "12,345" (toLocaleString)  
**Target:** `12345` → "12.3k" (formatter needed)

```typescript
// Recommended formatter
function formatLikes(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toLocaleString();
}
```

### Missing Avatar

**Current:** Shows fallback letter via OptimizedAvatar  
**Status:** ✅ Handled correctly

### 2-Column Breakpoints

**Current:** Always 2 columns (`grid-cols-2`)  
**No responsive behavior**

**Recommendation:** Keep 2-column for mobile consistency

---

## 8. Device Matrix (Quick Check)

| Device | Browser | Status | Notes |
|--------|---------|--------|-------|
| iPhone 13 | Safari | ⚠️ Not tested | Need manual test |
| iPhone 15 | Safari | ⚠️ Not tested | Need manual test |
| Pixel 7 | Chrome | ⚠️ Not tested | Need manual test |
| Desktop | Chrome | ✅ Visible | From session replay |

**Known issues:**
- No device-specific testing completed
- Font rendering may vary (Inter vs SF Pro)
- `-webkit-line-clamp` has Safari quirks with flex parents

---

## 9. Delta Summary — Current vs Target Spec

### Changes Required

| Component | Change | Priority |
|-----------|--------|----------|
| **Avatar** | 20px → 28px | P0 |
| | Add 1px ring (#6E9277 when yours) | P1 |
| **Username** | Add font-semibold, color #6E9277 | P0 |
| | Add click → profile navigation | P0 |
| | Add fade mask truncation at 60% width | P1 |
| **Like Button** | Add interactive handler (optimistic) | P0 |
| | Increase touch target to 44×44px | P0 |
| | Add micro-pop animation on toggle | P2 |
| | Add haptics (mobile) | P3 |
| **Caption** | Move below meta row (currently title above) | P0 |
| | Change to 2-line clamp with gradient fade | P0 |
| | Add fade overlay (not hard ellipsis) | P1 |
| **Formatter** | Add `formatLikes(count)` for k/M notation | P1 |
| **Skeleton** | Add ShortsCardMetaSkeleton component | P2 |
| **Performance** | Add React.memo to ShortCard | P1 |
| | Add fetchpriority hints to posters | P2 |

---

## 10. Implementation Checklist

### Phase 1: Layout & Styles (P0)
- [ ] Update avatar size to 28px
- [ ] Apply username styles (semibold, #6E9277)
- [ ] Restructure meta layout (avatar + name on left, like on right)
- [ ] Move caption below meta as 2-line element
- [ ] Add gradient fade to caption (not ellipsis)

### Phase 2: Interactions (P0)
- [ ] Add onClick to avatar/username → navigate to profile
- [ ] Add onLikeToggle handler with optimistic update
- [ ] Increase like button touch target to 44×44px
- [ ] Add aria-labels for accessibility

### Phase 3: Polish (P1-P2)
- [ ] Add avatar ring for own posts
- [ ] Add username fade mask truncation
- [ ] Add like count formatter (k/M)
- [ ] Add micro-pop animation on like
- [ ] Add React.memo to ShortCard
- [ ] Add ShortsCardMetaSkeleton

### Phase 4: Performance (P2-P3)
- [ ] Add fetchpriority="high" to first 2 posters
- [ ] Add decoding="async" to images
- [ ] Instrument React Profiler
- [ ] Add haptics on mobile (navigator.vibrate)

---

## 11. Files to Modify

1. **`src/components/shorts/ShortCard.tsx`** (Primary)
   - Lines 74-103: Restructure meta layout
   - Add like toggle handler
   - Add profile navigation

2. **`src/components/discover/ShortsGrid.tsx`**
   - Pass additional callbacks (onLike, onAuthorClick)
   - Update props interface

3. **`src/components/discover/DiscoverContent.tsx`**
   - Implement handleLike and handleAuthorClick
   - Pass handlers down to ShortsGrid

4. **New file:** `src/components/shorts/ShortsCardMeta.tsx`
   - Dedicated component for meta section
   - Props: author, caption, likeCount, isLiked, callbacks

5. **New file:** `src/utils/formatLikes.ts`
   - Formatter function for like counts

6. **Update:** `src/index.css`
   - Add `.scm__caption::after` gradient fade styles
   - Add animation keyframes for like-pop

---

## 12. CSS Variables Needed

```css
:root {
  --clb-green: #6e9277;
  --meta-fg: rgba(0,0,0,.82);
  --meta-dim: rgba(0,0,0,.55);
  --meta-fg-dark: rgba(255,255,255,.92);
  --meta-dim-dark: rgba(255,255,255,.65);
}

[data-theme="dark"] {
  --meta-fg: rgba(255,255,255,.92);
  --meta-dim: rgba(255,255,255,.65);
}
```

---

## 13. Acceptance Criteria

- ✅ All sizes match spec within 1px
- ✅ Avatar 28×28px with optional ring
- ✅ Username semibold #6E9277, tappable
- ✅ Caption 2-line with gradient fade
- ✅ Like button 44×44px touch target
- ✅ Like count formatted (k/M)
- ✅ All interactions work (profile nav, like toggle)
- ✅ No layout shift on like count change
- ✅ Skeleton loader matches final shape
- ✅ React.memo prevents unnecessary re-renders

---

**End of Audit Report**  
**Ready for surgical implementation of Creator-First spec.**
