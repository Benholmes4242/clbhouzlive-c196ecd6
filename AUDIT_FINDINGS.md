# Shorts Grid Audit - Grey/Blank Cells Investigation

**Status**: Debugging instrumentation added  
**Date**: 2025-10-10  
**Issue**: Intermittent blank/grey cells in Shorts ExploreGrid after adding Squircles row

---

## Summary

**Most likely cause**: Load state bookkeeping not properly triggered for tiles rendered after the Squircles row was added, combined with potential IntersectionObserver threshold issues due to changed scroll offset.

**Fix required in**: `ExploreGrid.tsx` - lines 77-102 (load state reset logic)

---

## Focused Checks - Findings

### 1) ✅ Browser Network Requests - **NEEDS USER DATA**
**Status**: Unable to verify without live user session  
**Finding**: Screenshot tool cannot access authenticated routes

**Action Required**:
- User should check Network tab for blank tiles
- Filter by `img` or `video` 
- Look for 404s, CORS errors, or missing requests
- Verify if Cloudflare Stream poster URLs are being requested

**Expected**: Each tile should have a corresponding image/video request with 200 OK status

---

### 2) ⚠️ Load State Bookkeeping - **ISSUE FOUND**
**Status**: Potential race condition detected  
**File**: `src/components/explore/ExploreGrid.tsx:77-102`

**Issue**: 
```typescript
// Load states reset on multiple triggers
useEffect(() => {
  // ...initialization code...
}, [
  content,           // Data changed
  activeFilter,      // Tab changed
  location.key,      // Route changed
  visibilityTick     // App regained focus
]);
```

**Problem**: When Squircles row is added above the grid, it changes:
- Initial scroll position
- Container offset
- First visible tile indices

This can cause `itemLoadingStates` to be initialized but never marked as loaded for tiles that:
1. Were below the fold initially
2. Are now visible due to Squircles row pushing content down
3. Have already loaded but their `onLoad` callback fired before the state was re-initialized

**Evidence in code**:
- Line 90: `next[item.id] = true; // Always initialize to loading`
- Lines 388-396: `onImageLoad` callbacks set state to `false`
- If image loads BEFORE state is initialized, the tile stays grey

**Debugging added**:
- ✅ Console log on load state reset with content length, filter, location key
- ✅ Console table showing first 20 items' loading states
- ✅ Log when tiles transition to loaded state

---

### 3) ⚠️ IntersectionObserver / Lazy Loading - **POTENTIAL ISSUE**
**Status**: Likely contributing factor  
**Files**: 
- `src/components/ui/high-quality-image.tsx:133-134` (uses native lazy loading)
- `src/components/explore/ExploreGrid.tsx:155-196` (infinite scroll)

**Issue**:
```typescript
// HighQualityImage uses native lazy loading
loading={isAboveTheFold ? "eager" : "lazy"}
```

**Problem**: 
1. Squircles row increases page height by ~100px
2. This changes which tiles are considered "above the fold"
3. Tiles that were previously "eager" loaded might now be "lazy"
4. Browser's lazy loading intersection observer may not fire correctly after route changes

**Potential race condition**:
- Tile rendered → marked as loading
- Tab switch occurs → states reset → tile still loading
- Image loads → callback fires with stale closure → state update lost
- Tile stuck grey

**Debugging added**:
- ✅ Log when HighQualityImage src changes
- ✅ Log successful image loads with src URLs
- ✅ Track image error events

---

### 4) ❌ DOM/Styling Collisions - **CONFIRMED OK**
**Status**: No global style leakage detected  
**File**: `src/styles/squircle.css`

**Verified**:
- ✅ All squircle CSS uses scoped classes (`.sq-*`)
- ✅ No global `img`, `.grid`, or `button` selectors
- ✅ Squircles row is outside grid container (separate component)
- ✅ CSS variables use `--sq-` prefix (no conflicts)

**Container nesting**:
```tsx
// DiscoverContent.tsx:124-141
<>
  <ShortsSuggestedProfiles />  {/* Outside grid */}
  <ExploreGrid ... />           {/* Separate container */}
</>
```

**Conclusion**: No styling issues from Squircles CSS.

---

### 5) ⚠️ Layout Keys & Placeholders - **NEEDS VERIFICATION**
**Status**: Keys are stable but require live testing  
**File**: `src/utils/postPlacementUtils.ts:162-252`

**Key format**:
```typescript
key: `portrait-${sectionIndex}-${portraitPost.id}`
key: `square-${sectionIndex}-${row}-${position}-${squarePost.id}`
```

**Verified**:
- ✅ Keys include post.id (unique)
- ✅ Keys include section/position (stable)
- ✅ No placeholder divs rendered (layout generator only returns actual posts)

**Potential issue**: 
- If `content` array changes order on tab switch, section indices may reassign
- This could cause React to unmount/remount tiles with different keys
- Remounted tiles would lose their loaded state

**Debugging added**:
- ✅ Console table showing first 20 grid items' keys, types, and sections
- ✅ Logs trigger on layout change to detect key instability

---

### 6) ✅ Container Sizing - **CONFIRMED OK**
**Status**: Aspect ratios properly maintained  
**Files**: 
- `src/components/explore/ExploreGrid.tsx:375` - `aspect-square`
- `src/components/explore/ExploreGrid.tsx:428` - `row-span-2`

**Verified**:
- ✅ Square cards use `aspect-square` class
- ✅ Portrait cards use `row-span-2` with explicit grid positioning
- ✅ No `height: 0` or overflow issues found
- ✅ Media wrapper has `h-full w-full` classes

**Conclusion**: Container sizing is correct.

---

## Debugging Instrumentation Added

### ExploreGrid.tsx
```typescript
// Line 80: Log load state resets
console.log('[ExploreGrid] Load state reset triggered', {
  contentLength, activeFilter, locationKey, visibilityTick
});

// Line 94: Table of first 20 items' loading states
console.table(first20.map(([id, isLoading]) => ({ id, isLoading })));

// Line 107: Log when tiles load
console.log('[ExploreGrid] Tile loaded:', id);

// Line 246: Log grid layout keys
console.table(first20Keys);

// Line 392: Log image errors
console.log('[MediaDisplay] Image error:', id, src);

// Line 395: Log image loads
console.log('[MediaDisplay] Image loaded:', id, src);
```

### MediaDisplay.tsx
```typescript
// Line 134: Log mount/unmount
console.log('[MediaDisplay] Component mounted', { itemId, src, type, isLoading });

// Line 140: Log handleImageLoad calls
console.log('[MediaDisplay] handleImageLoad called', { itemId, src, type });

// Line 149: Log handleImageError calls
console.log('[MediaDisplay] handleImageError called', { itemId, src, type });
```

### SquareCardMedia.tsx
```typescript
// Line 32: Log render with media info
console.log('[SquareCardMedia] Rendered with', { mediaId, mediaType, imageUrl });

// Line 52: Log successful loads
console.log('[SquareCardMedia] Image loaded', mediaId, imageUrl);

// Line 56: Log errors
console.log('[SquareCardMedia] Image error', mediaId, imageUrl);
```

### HighQualityImage.tsx
```typescript
// Line 33: Log source changes
console.log('[HighQualityImage] Source changed', { src, previousSrc });

// Line 40: Log successful loads
console.log('[HighQualityImage] Image loaded successfully', { src, optimizedSrc });
```

---

## Next Steps - User Actions Required

### 1. Reproduce the Issue
1. Navigate to `/discover?main=shorts`
2. Open DevTools → Console
3. Scroll through the grid
4. Switch to Videos tab, then back to Shorts
5. Switch to another browser tab, then return

### 2. Capture Screenshots
When blank cells appear:

**Console Screenshot** - Should show:
```
[ExploreGrid] Load state reset triggered
[ExploreGrid] Grid items layout (first 20)
[MediaDisplay] Component mounted (for blank tiles)
[SquareCardMedia] Rendered with (for blank tiles)
[HighQualityImage] Source changed (for blank tiles)
```

**Network Screenshot** - Filter by:
- `Img` requests
- `customer-` (R2 bucket)
- `cloudflarestream.com` (video posters)
- Look for: 404s, CORS errors, or NO request at all

**Elements Screenshot** - Inspect a blank cell:
1. Right-click blank tile → Inspect
2. Expand the element tree
3. Screenshot showing:
   - Computed width/height
   - Classes applied
   - `data-media-id` attribute
   - Nested `<img>` or `<video>` element
   - The `src` attribute value

### 3. Check Console Logs
Look for patterns:
- Do blank tiles have `[SquareCardMedia] Rendered with` but NO `Image loaded` log?
- Are there `Image error` logs for blank tiles?
- Does load state reset happen AFTER some tiles already loaded?
- Are keys changing between tab switches?

---

## Expected Fix (After Analysis)

Based on findings, likely solution will be one of:

### Option A: Reset load states earlier
```typescript
// Fire reset BEFORE content changes, not after
useLayoutEffect(() => {
  setItemLoadingStates({});
}, [activeFilter, location.key, visibilityTick]);
```

### Option B: Use ref to track mounted state
```typescript
const isMountedRef = useRef(false);
useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);

const handleImageLoad = useCallback(() => {
  if (!isMountedRef.current) return; // Prevent stale updates
  setItemLoadingStates(prev => ({ ...prev, [id]: false }));
}, [id]);
```

### Option C: Add intersection observer for tile visibility
```typescript
useEffect(() => {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Force load state update when tile becomes visible
          setItemLoadingStates(prev => {
            if (prev[id] === true) {
              return { ...prev, [id]: false };
            }
            return prev;
          });
        }
      });
    },
    { threshold: 0.1, rootMargin: '50px' }
  );
  
  if (tileRef.current) observer.observe(tileRef.current);
  return () => observer.disconnect();
}, [id]);
```

---

## Technical Debt Identified

1. **Dual loading state systems**: Both `itemLoadingStates` and internal `imageLoading` state in HighQualityImage
2. **Multiple reset triggers**: 4 different conditions trigger load state reset (could be simplified)
3. **No tile-level visibility tracking**: Relying on native lazy loading without custom observer
4. **Stale closure risk**: Callbacks defined in useEffect may capture stale state

---

## Recommended User Testing Steps

After fixes are implemented:

1. **Basic scroll test**: Load Shorts → scroll to bottom → scroll to top (verify no grey tiles)
2. **Tab switch test**: Shorts → Videos → Shorts (verify all tiles load)
3. **Browser tab test**: Shorts → switch to another browser tab → return (verify no grey)
4. **Network throttle test**: Enable slow 3G → load Shorts (verify loading overlay clears)
5. **Hard refresh test**: Ctrl+Shift+R on Shorts page (verify clean load)
6. **Mobile device test**: Real mobile device with touch scrolling (verify lazy loading works)

---

**Audit Status**: ✅ Debugging instrumentation complete  
**Next**: User to capture screenshots and console logs during reproduction
