/**
 * Fullscreen Media Viewer - Unified exports
 * 
 * Phase 5 implementation of the modular fullscreen viewer system.
 */

// Main viewer container
export { FullscreenMediaViewer } from './FullscreenMediaViewer';
export type { FullscreenMediaViewerProps } from './FullscreenMediaViewer';

// Sub-components
export { FullscreenNavigation } from './FullscreenNavigation';
export { FullscreenMediaItem, SingleMediaDisplay } from './FullscreenMediaItem';
export { MediaCarousel } from './MediaCarousel';
export { FullscreenOverlay, CreatorInfo, ActionRail, CaptionDisplay } from './FullscreenOverlay';
export { FullscreenControls } from './FullscreenControls';
export { FullscreenComments } from './FullscreenComments';

// Hooks
export { 
  useFullscreenViewer, 
  useFullscreenViewerContext,
  useFullscreenViewerOptional,
  FullscreenViewerContext,
} from '../hooks/useFullscreenViewer';
export type { 
  FullscreenMediaItem as FullscreenMediaItemType,
  UseFullscreenViewerOptions,
  UseFullscreenViewerReturn,
  FullscreenContext,
} from '../hooks/useFullscreenViewer';

export { 
  useSwipeNavigation, 
  useVerticalSwipe, 
  useHorizontalSwipe,
} from '../hooks/useSwipeNavigation';
export type { 
  SwipeNavigationOptions, 
  SwipeNavigationReturn,
} from '../hooks/useSwipeNavigation';
