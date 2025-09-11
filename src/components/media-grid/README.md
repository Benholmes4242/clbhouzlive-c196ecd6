# Media Grid System

A unified media grid component system extracted from ExploreGrid for consistent media display across the application.

## Phase 1 & 2 Implementation ✅

### Components Created

- **`MediaGrid.tsx`** - Main grid container with configurable layouts
- **`MediaDisplay.tsx`** - Copied from explore/MediaDisplay.tsx for media rendering
- **`types.ts`** - TypeScript interfaces and preset configurations
- **`useMediaGrid.ts`** - Hook for grid state management
- **`adapters/`** - Data transformation utilities

### Current Status

**✅ Proof of Concept Active**: CourseMediaTab now supports both:
- Original ExploreGrid (for comparison)
- New MediaGrid with `modalMedia` preset

### MediaGrid Configuration

```typescript
const modalMediaConfig = {
  layout: 'modal',
  columns: { mobile: 2, tablet: 3, desktop: 4 },
  spacing: 'normal', // gap-4
  aspectRatio: 'square',
  features: {
    heroCards: false,
    portraitPriority: false,
    sectionBased: false,
    infiniteScroll: false,
    autoplay: true,
    badges: false,
    userInteractions: false
  }
};
```

### Usage Example

```typescript
import { MediaGrid, GRID_PRESETS, adaptExploreContentToMediaItems } from '@/components/media-grid';

<MediaGrid
  items={mediaItems}
  config={{
    ...GRID_PRESETS.modalMedia,
    interactions: { onMediaClick: handleClick }
  }}
  isLoading={isLoading}
/>
```

## Testing

### A/B Testing in CourseMediaTab
- Toggle button to switch between ExploreGrid and MediaGrid
- Same data source, different rendering approaches
- Visual comparison of layouts and behavior

### Key Differences
- **MediaGrid**: Clean uniform grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`)
- **ExploreGrid**: Complex section-based layout with 1px gutters

## Next Steps (Not Implemented Yet)

### Phase 3: Additional Presets
- `discover` preset (full ExploreGrid functionality)
- `profileActivity` preset (simplified ExploreGrid)

### Phase 4: Full Migration
- Replace ExploreGrid usage across the app
- Remove original ExploreGrid component
- Clean up unused code

## Technical Notes

### Performance
- Memoized layout calculations
- Individual loading state tracking
- Preserved autoplay and lazy loading

### Compatibility
- Type-safe adapters for data transformation
- Backward compatible with existing lightbox integration
- Portal-based modal rendering preserved

### Bundle Impact
- MediaDisplay copied (not moved) to avoid breaking changes
- Minimal additional bundle size (~15KB estimated)
- No breaking changes to existing components