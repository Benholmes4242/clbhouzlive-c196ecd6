/**
 * UniversalMediaGrid - One True Grid™
 * 
 * Single unified grid component that handles ALL media grid use cases.
 * Replaces multiple fragmented implementations with one configurable system.
 */

// Main component
export { UniversalMediaGrid, default } from './UniversalMediaGrid';

// Types
export type {
  GridLayout,
  AutoplayPattern,
  GridSurface,
  UniversalGridConfig,
  UniversalMediaItem,
  UniversalMediaGridProps,
} from './types';

export {
  DEFAULT_CONFIGS,
  PORTRAIT_ASPECT,
  LANDSCAPE_ASPECT,
  GRID_GAP_PX,
  AR_LANDSCAPE_THRESHOLD,
  AR_PORTRAIT_THRESHOLD,
} from './types';

// Components
export { default as MediaTile } from './MediaTile';
export { default as HeroTile } from './HeroTile';
export { TilePlaceholder } from './TilePlaceholder';
export { TileOptionsMenu } from './TileOptionsMenu';

// Layouts
export {
  PortraitGridLayout,
  VerticalFeedLayout,
  VerticalFeedItem,
  HeroGridLayout,
  MixedGridLayout,
  MixedGridItem,
} from './layouts';

// Hooks
export {
  useAutoplayPattern,
  markAutoplayCandidates,
  useViewportTracking,
  useGridMediaRuntime,
  useVerticalFeedRuntime,
} from './hooks';

// Adapters
export {
  exploreItemToUniversal,
  exploreItemsToUniversal,
  activityItemToUniversal,
  activityItemsToUniversal,
  activityPostToUniversal,
  activityPostsToUniversal,
} from './adapters';