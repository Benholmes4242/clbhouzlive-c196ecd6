# Performance Audit — Discover › Videos & Shorts

## Overview

This document outlines the performance instrumentation added to measure render times, network timing, and identify bottlenecks in the Discover page (Videos and Shorts tabs).

**Status:** Audit-only instrumentation. No UX/logic changes have been made.

---

## Instrumentation Added

### 1. Performance Monitoring Hook (`usePerfMonitor`)

**Location:** `src/hooks/usePerfMonitor.ts`

**What it does:**
- Tracks component mount time
- Measures time from mount to first requestAnimationFrame (paint)
- Logs results to console with `[perf]` prefix

**Instrumented Components:**
- ✅ `Discover` (page level)
- ✅ `DiscoverContent`
- ✅ `CinematicVideoCard` (Videos tab)
- ✅ `ShortCard` (Shorts tab)
- ✅ `ShortsGrid`
- ✅ `ShortsSuggestedProfiles` (squircles row)

### 2. Image/Thumbnail Load Tracking

**Functions:** `trackImageLoad()`, `trackVideoReadiness()`

**What it tracks:**
- Time to load each thumbnail/poster image
- Video readiness events: `loadstart`, `loadedmetadata`, `loadeddata`, `canplay`, `canplaythrough`
- Success/failure of image loads

**Instrumented in:**
- ✅ `CinematicVideoCard` — video poster images
- ✅ `ShortCard` — thumbnail images

### 3. Data Resolution Timing

**Location:** `Discover.tsx`

**Marks:**
- `discover:route:mount` — When route component mounts
- `discover:data:first-set` — When first content arrives
- **Measure:** `discover:data:resolve` — Time from mount to first data

### 4. Interleave Computation Timing

**Location:** `DiscoverContent.tsx`

**What it measures:**
- Time to compute the interleaved feed (Videos "All" tab only)
- Logs number of items processed and duration

### 5. Squircles Visibility Tracking

**Location:** `ShortsSuggestedProfiles.tsx`

**What it tracks:**
- Logs when first 6 squircle avatars are loaded and visible

---

## How to Run the Audit

### Step 1: Open DevTools Console

1. Navigate to `/discover?main=videos` or `/discover?main=shorts`
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Filter by `[perf]` to see performance logs

### Step 2: Test Scenarios

Run each scenario with **cold cache** and **warm cache**:

#### A. Videos Tab (`/discover?main=videos`)
- Test with different duration filters: All, Shorts, Under 4min, 4-20min, 20min+
- Check "All" tab for interleave computation time

#### B. Shorts Tab (`/discover?main=shorts`)
- Test initial load
- Check squircles row load time

### Step 3: Device & Network Throttling

**Recommended test setup:**

| Device | Network | CPU Throttling |
|--------|---------|----------------|
| iPhone 13 (390×844, DPR 3) | Fast 3G | 4× slowdown |
| iPhone 13 (390×844, DPR 3) | Good 4G | No throttling |
| Desktop (1920×1080) | Fast 3G | No throttling |

**Chrome DevTools Settings:**
1. **Performance** tab → ⚙️ Settings
2. Network: Fast 3G / Good 4G
3. CPU: 4× slowdown (for mid-tier device simulation)

### Step 4: Capture Performance Profile

1. Go to **Performance** tab in DevTools
2. Click **Record** (●)
3. Reload the page (Cmd/Ctrl + R)
4. Wait for first viewport to fully render
5. Stop recording
6. **Save** the profile (💾 icon)

### Step 5: Capture Network Waterfall

1. Go to **Network** tab
2. Clear (🚫)
3. Reload page
4. Wait for first paint
5. **Take screenshot** of waterfall (first 5 seconds)
6. Note:
   - Number of requests before first paint
   - Total bytes transferred
   - Blocking resources (fonts, CSS, analytics)

---

## Console Log Format

All performance logs follow this format:

```javascript
[perf] {
  component: "ComponentName",
  "mount→raf": "42.50ms",
  timestamp: "2025-10-16T04:00:00.000Z",
  ...metadata
}
```

### Example Logs

**Component mount:**
```
[perf] {
  component: "Discover",
  "mount→raf": "12.30ms",
  route: "/discover?main=shorts"
}
```

**Data resolution:**
```
[perf] discover:data:resolve 245.67ms items: 24
```

**Image load:**
```
[perf] image loaded {
  context: "ShortCard:thumb:abc-123",
  src: "https://media.clbhouz.co.uk/...",
  duration: "523.45ms"
}
```

**Video events:**
```
[perf] video:loadstart abc-123
[perf] video:loadedmetadata abc-123
[perf] video:canplay abc-123
```

**Interleave computation:**
```
[perf] interleave compute {
  items: 30,
  duration: "15.20ms"
}
```

**Squircles visibility:**
```
[perf] first 6 squircles visible {
  count: 6,
  timestamp: "2025-10-16T04:00:05.000Z"
}
```

---

## Key Metrics to Collect

### Core Web Vitals (from Performance tab)
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TBT** (Total Blocking Time)

### Custom Metrics (from Console)
- Time to first thumbnail visible
- Time to first video poster loaded
- Time to first playable video (`canplay` event)
- Time to first 6 shorts tiles visible
- Time to first 6 squircles visible
- Number of network requests before first paint
- Total bytes transferred before first paint

### Component Timing
- `Discover` mount→raf
- `DiscoverContent` mount→raf
- `CinematicVideoCard` mount→raf (Videos tab)
- `ShortCard` mount→raf (Shorts tab)
- `ShortsGrid` mount→raf
- `ShortsSuggestedProfiles` mount→raf

---

## Expected Bottlenecks to Look For

1. **Data waterfalls:** Multiple sequential API calls before render
2. **Large images:** Oversized thumbnails/posters for rendered dimensions
3. **Blocking resources:** Fonts, CSS, analytics delaying FCP
4. **Interleave computation:** Expensive feed building on Videos "All" tab
5. **Skeleton delays:** Keeping skeletons until all data returns instead of per-card progressive reveal
6. **Lazy loading:** Images loading only after component mount instead of preloading

---

## Network Request Inspection Checklist

For each thumbnail/poster/video in first viewport:

- [ ] **URL** and **CDN** used
- [ ] **Cache headers:** `Cache-Control`, `ETag`, `Age`
- [ ] **Image format:** JPG/WebP/AVIF
- [ ] **Image dimensions:** Actual vs rendered (look for oversized assets)
- [ ] **Compression:** gzip/brotli
- [ ] **Priority:** Check if `fetchpriority="high"` is used
- [ ] **Preload:** Check if critical assets are preloaded in `<head>`

---

## Data Collection Template

### Test Run: [Date/Time]

**Tab:** Videos / Shorts  
**Device:** iPhone 13 / Desktop  
**Network:** Fast 3G / Good 4G  
**CPU:** 4× / None  
**Cache:** Cold / Warm  

#### Metrics

| Metric | Value |
|--------|-------|
| FCP | ms |
| LCP | ms |
| TBT | ms |
| Time to first thumbnail | ms |
| Time to first video poster | ms |
| Time to first playable video | ms |
| Time to first 6 shorts tiles | ms |
| Time to first 6 squircles | ms |
| Requests before first paint | count |
| Bytes before first paint | KB |

#### Component Timing

| Component | mount→raf |
|-----------|-----------|
| Discover | ms |
| DiscoverContent | ms |
| CinematicVideoCard | ms |
| ShortCard | ms |
| ShortsGrid | ms |
| ShortsSuggestedProfiles | ms |

#### Top Bottlenecks

1. [Issue description + duration/impact]
2. [Issue description + duration/impact]
3. [Issue description + duration/impact]

---

## Next Steps (After Audit)

Once data is collected, analyze and prioritize:

1. **Quick wins** — Low effort, high impact fixes
2. **Image optimization** — Resize, format conversion, preloading
3. **Data fetching** — Reduce waterfalls, add parallel loading
4. **Code splitting** — Defer non-critical components
5. **Progressive rendering** — Show skeletons per-card instead of waiting for all data

---

## Notes

- All instrumentation is **debug-only** and will not affect production performance
- Console logs use `console.debug()` which can be filtered out in production
- Performance marks are cleaned up on component unmount
- No behavioral changes have been made to the application

---

## Tools Used

- **React hooks:** `useEffect`, `useMemo`, `useRef`
- **Performance API:** `performance.mark()`, `performance.measure()`, `performance.now()`
- **Browser DevTools:** Performance profiler, Network inspector, Console
