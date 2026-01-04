# Activity Grid V2

Premium grid layout for Profile Activity tab with distinctive PP → L pattern.

## Layout Pattern

```
┌─────┬─────┐
│  P  │  P  │  ← Portrait Pair (3:4 aspect, 1 col each)
├─────┴─────┤
│     L     │  ← Landscape Hero (16:9 aspect, full width)
├─────┬─────┤
│  P  │  P  │  ← Portrait Pair
├─────┴─────┤
│     L     │  ← Landscape Hero
└───────────┘
```

**Repeat:** PP → L → PP → L → ...

**Edge cases:**
- **Lone portrait at end:** Renders as full-width hero portrait (3:4 aspect)
- **No landscapes available:** Continues with portrait pairs (PP → PP → PP)
- **All landscapes:** Renders as L → L → L

## Architecture

- **`types.ts`** - Layout types, config, landscape eligibility
- **`layoutEngine.ts`** - PP → L packing algorithm with 5-item lookahead
- **`useActivityPostsV2.ts`** - Cursor-based pagination (24 items/page)
- **`ActivityGridV2.tsx`** - Grid component with lazy loading & autoplay

## Key Features

- **2-column grid** with 2px gap
- **Landscape detection:** Only true landscape media (AR > 1.0)
- **5-item lookahead:** Minimal reordering for landscape selection
- **Stable pagination:** Append-only, no reshuffling
- **Autoplay:** 60% visible to start, 20% to stop (hysteresis)
- **Accessibility:** Respects `prefers-reduced-motion`, keyboard focus support

## Performance

- Cursor-based infinite scroll (800px trigger)
- Lazy tile loading (initial 6, preload 2 viewports)
- Max 2 concurrent autoplaying videos
- Debounced scroll handling (1s lockout)

## Metrics

The grid logs the following metrics to console:
- `grid_render_time` - Initial render time in ms
- `landscape_utilization` - Ratio of landscape blocks to expected
- `autoplay_failure` - Failures to autoplay videos

## Usage

```tsx
import { ActivityGridV2, useActivityPostsV2 } from '@/components/profile/activity/v2';

function ActivityTab({ userId }) {
  const { 
    items, 
    isLoading, 
    hasNextPage, 
    fetchNextPage 
  } = useActivityPostsV2(userId);

  return (
    <ActivityGridV2
      items={items}
      isLoading={isLoading}
      hasMore={hasNextPage}
      onLoadMore={fetchNextPage}
      onItemClick={(item, idx) => openFullscreen(item)}
    />
  );
}
```

## Configuration

```tsx
const config: Partial<ActivityGridV2Config> = {
  landscapeLookahead: 5,  // Items to search for landscape candidates
  pageSize: 24,           // Items per page (8 blocks × 3)
  gapPx: 2,               // Gap between tiles
  autoplayEnabled: true,  // Enable video autoplay
  maxAutoplay: 2,         // Max concurrent autoplaying videos
  playThreshold: 0.6,     // Start at 60% visible
  pauseThreshold: 0.2,    // Stop at 20% visible (hysteresis)
};
```
