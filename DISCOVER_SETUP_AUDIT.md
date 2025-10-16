# Discover Page Setup Audit
**Date**: 2025-10-16  
**Routes**: `/discover?main=videos` and `/discover?main=shorts`

---

## 🧱 1. Component Structure

### Videos Tab (`/discover?main=videos`)
**Render Order:**
```
Discover.tsx
  └─ DiscoverContent.tsx
      └─ SlidingPanels (duration filters: all/under_5/5_to_15/over_15)
          └─ VideosGrid
              └─ CinematicVideoCard × N
```

### Shorts Tab (`/discover?main=shorts`)
**Render Order:**
```
Discover.tsx
  └─ ShortsSuggestedProfiles (horizontal squircle row)
  └─ DiscoverContent.tsx
      └─ ShortsGrid (masonry layout)
          └─ ShortCard × N
```

### Key Observations:
- **Videos**: Uses `SlidingPanels` wrapper with 4 duration sub-tabs → creates multiple DOM trees
- **Shorts**: Renders squircles (`ShortsSuggestedProfiles`) + grid simultaneously
- **No lazy loading**: All components mount immediately; no code-splitting or `React.lazy`

---

## ⚙️ 2. Data Fetching Flow

### Videos Tab Data Chain:
1. **Discover.tsx** → `useInfiniteExploreContent(activeFilter='videos', ...)`
2. **DiscoverContent.tsx** receives `content` array
3. **On 'all' duration filter** → runs `buildInterleavedFeed(...)` synchronously
   - Calls `getNextShort()` and `getNextChannel()` multiple times
   - Computes entire interleaved feed before render
4. **VideosGrid** receives final feed array

**Issues:**
- ❌ **Interleave blocking**: `buildInterleavedFeed` runs synchronously in `useMemo` (~10-50ms for 30 items)
- ❌ **Sequential logic**: Feed must compute before first video card renders
- ❌ **Double data deps**: Depends on both video data AND shorts/channels data being ready
- ✅ **Prefetch**: `useShortsSuggestions` triggers prefetch when pool runs low

### Shorts Tab Data Chain:
1. **Discover.tsx** → `useInfiniteExploreContent(activeFilter='shorts', ...)`
2. **ShortsSuggestedProfiles** → `useMixedProfiles()` (separate data fetch!)
3. **DiscoverContent.tsx** → `ShortsGrid` receives `content` array

**Issues:**
- ❌ **Separate fetch**: Squircles use `useMixedProfiles()` (separate API call), not from main content
- ❌ **No coordination**: Squircles and shorts grid load independently
- ⚠️ **Potential waterfall**: If squircles block, main grid still waits for its own data

### Data Fetching Analysis:
**Sequential Issues:**
- `useInfiniteExploreContent` doesn't parallelize initial fetch
- Each filter change triggers new fetch + state reset
- No preloading for inactive tabs

**Caching:**
- ✅ Uses cache keys per filter: `${activeFilter}:${subFilter}:${durationFrom}-${durationTo}`
- ✅ Aggressive preloading: `preloadMore()` fetches next batch early
- ⚠️ Cache doesn't persist across route changes

---

## 🖼️ 3. Media Handling

### Video Tab Media:
**CinematicVideoCard** (`src/components/discover/CinematicVideoCard.tsx`):
- `<video poster={thumbnailUrl}>` - uses Cloudflare Stream thumbnail
- `loading="lazy"` NOT set on poster images
- Videos autoplay on scroll (via `IntersectionObserver`)
- Tracks load events: `loadeddata`, `canplay`, `canplaythrough`

**Issues:**
- ❌ **No lazy loading**: Poster images load immediately (no `loading="lazy"`)
- ❌ **No preconnect**: No `<link rel="preconnect">` to Cloudflare Stream domain
- ❌ **No priority hints**: First-row videos not marked `fetchpriority="high"`

### Shorts Tab Media:
**ShortCard** (`src/components/shorts/ShortCard.tsx`):
- `<img loading="lazy">` ✅ - thumbnails are lazy loaded
- Autoplay videos for some cards (masonry pattern)
- Uses `trackImageLoad()` for performance monitoring

**ShortsSuggestedProfiles** (squircles):
- Uses `OptimizedAvatar` component with lazy loading
- Images from `media.clbhouz.co.uk` (external, slow server per logs)
- No skeleton shape mismatch mentioned (using `Squircle` component)

**Issues:**
- ❌ **External media slow**: User avatars from `media.clbhouz.co.uk` take 7-15s (per logs)
- ❌ **No preconnect**: No DNS prefetch for `media.clbhouz.co.uk`
- ❌ **Large banners**: Channel banners 358KB-1.2MB (per logs)

---

## 🎨 4. Rendering & Skeleton Setup

### Videos Tab Skeletons:
**Location**: Inside `VideosGrid` component (not found in audit, assuming standard skeleton cards)
- Likely uses generic card skeletons
- No specific skeleton for `CinematicVideoCard` found in code

### Shorts Tab Skeletons:
**ShortsSuggestedProfiles**:
```tsx
// Line 12-22 in ShortsSuggestedProfiles.tsx
function Skeleton() {
  return (
    <div className="inline-flex flex-col items-center gap-1.5 px-1.5 first:pl-2 last:pr-2">
      <Squircle 
        src="" 
        size={60} 
        className="bg-muted/50 blur-sm"
      />
      <div className="w-[60px] h-3 bg-muted/50 rounded blur-sm" />
    </div>
  );
}
```
✅ **Uses Squircle component** - shape matches avatars

**ShortsGrid**: No explicit skeleton component found
- Assumes empty state or loading spinner

**Issues:**
- ⚠️ **No per-card skeletons**: Shorts grid doesn't show placeholder cards during load
- ⚠️ **Videos tab skeleton unknown**: Need to verify VideosGrid skeleton implementation
- ✅ **Squircle skeleton correct**: Uses same `Squircle` component with blur effect

---

## 🧩 5. Component Dependencies

### Discover.tsx Imports:
```tsx
// Heavy imports:
- SegmentedControl
- DiscoverVideosHeader  
- ExploreFilters
- SlidingPanels
- ChannelsFeed
- FollowingFeed
- DiscoverContent
- FullscreenMediaModal
- DiscoverVerticalFeed
```
**Issues:**
- ❌ **No code splitting**: All components bundled together
- ❌ **Unused components loaded**: Modal and VerticalFeed loaded even if not used

### DiscoverContent.tsx Imports:
```tsx
// Heavy dependencies:
- SlidingPanels (nested sliding panels!)
- VideosGrid
- ShortsGrid  
- ExploreGrid
- CreatorHighlightShelf
- ShortsSuggestedProfiles
- buildInterleavedFeed (compute-heavy utility)
```
**Issues:**
- ❌ **All grids loaded**: Videos, Shorts, and Explore grids all imported regardless of tab
- ❌ **Nested SlidingPanels**: Videos tab uses SlidingPanels inside SlidingPanels (outer main tabs, inner duration filters)

### Re-render Risks:
**Discover.tsx**:
- `mediaItems` recalculated on every `content` or `optimisticPosts` change
- Filter changes cause full component tree re-render

**DiscoverContent.tsx**:
- `buildInterleavedFeed` runs in `useMemo` but depends on `getNextShort`/`getNextChannel` callbacks
- Callbacks might not be stable → potential re-computation

---

## 🚨 Top Bottlenecks Identified

### 1. **Interleave Computation Blocking (Videos Tab)**
- `buildInterleavedFeed` runs synchronously before render
- Depends on 3 data sources (videos + shorts + channels) being ready
- **Impact**: First paint delayed until interleave completes

### 2. **External Media Server Latency**
- User avatars from `media.clbhouz.co.uk`: **7-15 seconds** (per console logs)
- No DNS prefetch or preconnect
- **Impact**: Squircles show skeletons for 10+ seconds

### 3. **Large Channel Banner Images**
- Banners: 358KB-1.2MB JPEGs
- No image optimization or responsive srcsets
- **Impact**: 5-10 second loads block layout on channels tab

### 4. **No Lazy Loading on Video Posters**
- `CinematicVideoCard` poster images load immediately
- No `loading="lazy"` attribute
- **Impact**: First viewport requests 10+ poster images simultaneously

### 5. **No Code Splitting**
- All tabs and grids loaded upfront
- No `React.lazy` for modals or inactive tabs
- **Impact**: Larger initial JS bundle, slower initial parse

---

## ✅ Immediate Improvement Recommendations

### Quick Wins (No Major Refactor):
1. **Add `loading="lazy"` to video posters** in `CinematicVideoCard`
2. **Add DNS preconnect**:
   ```html
   <link rel="preconnect" href="https://customer-4ah4gni80ytefpck.cloudflarestream.com">
   <link rel="preconnect" href="https://media.clbhouz.co.uk">
   ```
3. **Add `fetchpriority="high"` to first 2 video posters** in VideosGrid
4. **Optimize channel banners**: Resize to 800x400 max, convert to WebP
5. **Move `buildInterleavedFeed` to Web Worker** (or defer to idle callback)

### Medium Effort:
6. **Code-split modals and inactive grids** with `React.lazy`
7. **Prefetch shorts/channels data** when Videos tab loads
8. **Add skeleton cards** to ShortsGrid during loading
9. **Cache `useMixedProfiles` results** across route changes

### Long-term Architecture:
10. **Virtual scrolling** for long feeds (Videos tab "all" can be 100+ items)
11. **Incremental interleaving**: Build feed progressively as user scrolls
12. **CDN migration**: Move user avatars to faster CDN (or Cloudflare Images)

---

## 📊 Performance Instrumentation Status

**Already Implemented:**
- ✅ `usePerfMonitor` in all key components
- ✅ `trackImageLoad` for thumbnails
- ✅ `trackVideoReadiness` for video events
- ✅ `buildInterleavedFeed` timing logged

**Missing from Logs:**
- ❌ No `[perf]` logs visible in console (auth-protected pages?)
- ⚠️ Need manual testing while logged in to see instrumentation output

---

## 🧪 Next Steps for Testing

Once manual testing is complete, focus on:
1. **Network waterfall**: Identify request parallelization opportunities
2. **Interleave timing**: Measure actual `buildInterleavedFeed` duration
3. **Squircle load cascade**: When do first 6 squircles become visible?
4. **Skeleton accuracy**: Confirm squircle skeletons match avatar shapes
5. **Cache effectiveness**: Does warm cache significantly improve load times?
