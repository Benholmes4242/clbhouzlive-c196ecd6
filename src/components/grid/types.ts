/**
 * UniversalMediaGrid Types
 * 
 * One True Grid™ - Unified configuration for all grid/feed surfaces
 */

// ============ Layout Modes ============

export type GridLayout = 
  | 'vertical-feed'    // Clubhouse-style snap-scroll vertical feed
  | 'portrait-grid'    // 2-3 column portrait grid (Watch, Profile Activity)
  | 'mixed-grid'       // Portrait + landscape mix (Explore)
  | 'hero-grid';       // Hero video + grid below

// ============ Autoplay Patterns ============

export type AutoplayPattern = 
  | 'center-only'      // Only center/focused item autoplays (Clubhouse)
  | 'every-nth'        // Every Nth item autoplays (Watch grid)
  | 'custom'           // Custom pattern (determined by item.isAutoplayCandidate)
  | 'hero-only'        // Only hero autoplays
  | 'viewport'         // All visible items autoplay (multi-video)
  | 'none';            // No autoplay

// ============ Surface Identification ============

export type GridSurface = 
  | 'clubhouse'        // Vertical feed (highest priority)
  | 'shorts'           // Watch/Shorts grid
  | 'discover'         // Explore/Discover grid
  | 'profile'          // Profile activity grid
  | 'trending'         // Trending page
  | 'business';        // Business profile activity

// ============ Grid Configuration ============

export interface UniversalGridConfig {
  // Layout
  layout: GridLayout;
  columns?: number;           // For grid layouts (default: 2 portrait, auto for mixed)
  
  // Autoplay behavior
  autoplayPattern: AutoplayPattern;
  autoplayNth?: number;       // For 'every-nth' pattern (default: 3)
  maxConcurrent?: number;     // Max simultaneous autoplays (undefined = unlimited)
  
  // Surface identification
  surface: GridSurface;
  
  // Performance
  lazyLoad?: boolean;         // Default: true
  preloadViewports?: number;  // Viewports ahead to preload (default: 2)
  initialVisible?: number;    // Initial tiles to render (default: 6)
  
  // Hero features
  hasHero?: boolean;          // Show hero video at top
  heroAutoplay?: boolean;     // Hero autoplays independently
  
  // Visibility thresholds
  playThreshold?: number;     // Play when X% visible (default: 0.4)
  pauseThreshold?: number;    // Pause when X% invisible (default: 0.25)
  
  // UI overlays
  showCreator?: boolean;
  showLikes?: boolean;
  showDuration?: boolean;
  
  // Infinite scroll
  infiniteScroll?: boolean;
  pageSize?: number;
}

// ============ Media Item ============

export interface UniversalMediaItem {
  id: string;
  postId: string;
  type: 'image' | 'video';
  
  // Media URLs
  url: string;                // Primary media URL
  thumbnailUrl?: string;      // Poster/thumbnail
  playbackUrl?: string;       // HLS stream URL
  mp4FallbackUrl?: string;    // AUDIT FIX #2: MP4 fallback when HLS fails
  
  // Dimensions
  mediaWidth?: number;
  mediaHeight?: number;
  aspectRatio?: number;       // width/height
  
  // Duration
  durationSeconds?: number | null;
  
  // Creator
  creator?: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    verified?: boolean;
  };
  
  // Engagement
  likes?: number;
  commentCount?: number;
  
  // Golf-specific
  golfCourseId?: string;
  courseName?: string;
  
  // Content flags
  isFeatured?: boolean;
  isPopular?: boolean;
  isTrending?: boolean;
  isMilestone?: boolean;
  
  // Multi-media
  additionalMediaCount?: number;
  
  // Computed at runtime
  isAutoplayCandidate?: boolean;
  sortIndex?: number;
  orientation?: 'portrait' | 'landscape' | 'square';
  tileVariant?: 'portrait' | 'landscape';
}

// ============ Grid Props ============

export interface UniversalMediaGridProps {
  items: UniversalMediaItem[];
  config: UniversalGridConfig;
  
  // Loading state
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  
  // Callbacks
  onItemClick?: (item: UniversalMediaItem, index: number) => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  
  // Context
  currentUserId?: string;
  
  // Ownership - for delete functionality
  isOwnProfile?: boolean;
  onDeletePost?: (postId: string) => void;
  
  // Hero (if hasHero: true)
  heroItem?: UniversalMediaItem;
  onHeroClick?: (item: UniversalMediaItem) => void;
  
  // Vertical feed specific
  onCurrentIndexChange?: (index: number) => void;
  onScrollStateChange?: (isScrolling: boolean) => void;
  
  // Chrome state (for cinematic overlays)
  chromeState?: 'visible' | 'hidden';
}

// ============ Layout Constants ============

export const PORTRAIT_ASPECT = '3/4';
export const LANDSCAPE_ASPECT = '16/9';
export const GRID_GAP_PX = 0;

// Aspect ratio thresholds
export const AR_LANDSCAPE_THRESHOLD = 1.25;  // >= 1.25 = landscape
export const AR_PORTRAIT_THRESHOLD = 0.85;   // <= 0.85 = portrait

// ============ Default Configs ============

export const DEFAULT_CONFIGS: Record<GridSurface, Partial<UniversalGridConfig>> = {
  clubhouse: {
    layout: 'vertical-feed',
    autoplayPattern: 'center-only',
    maxConcurrent: 3,
    lazyLoad: true,
    preloadViewports: 1,
    showCreator: true,
    showLikes: true,
    showDuration: false,
  },
  shorts: {
    layout: 'portrait-grid',
    columns: 2,
    autoplayPattern: 'every-nth',
    autoplayNth: 3,
    maxConcurrent: 3,
    lazyLoad: true,
    preloadViewports: 2,
    initialVisible: 6,
    showCreator: true,
    showLikes: false,
    showDuration: true,
    infiniteScroll: true,
    playThreshold: 0.4,
    pauseThreshold: 0.25,
  },
  discover: {
    layout: 'mixed-grid',
    autoplayPattern: 'every-nth',
    autoplayNth: 3,
    lazyLoad: true,
    preloadViewports: 2,
    initialVisible: 9,
    showCreator: true,
    showLikes: false,
    showDuration: true,
    infiniteScroll: true,
  },
  profile: {
    layout: 'portrait-grid',
    columns: 2,
    autoplayPattern: 'every-nth',
    autoplayNth: 3,
    maxConcurrent: 3,
    lazyLoad: true,
    preloadViewports: 2,
    initialVisible: 6,
    showCreator: false,
    showLikes: true,
    showDuration: true,
    infiniteScroll: true,
  },
  trending: {
    layout: 'hero-grid',
    hasHero: true,
    heroAutoplay: true,
    autoplayPattern: 'every-nth',
    autoplayNth: 3,
    lazyLoad: true,
    showCreator: true,
    showLikes: true,
    infiniteScroll: true,
  },
  business: {
    layout: 'portrait-grid',
    columns: 2,
    autoplayPattern: 'every-nth',
    autoplayNth: 3,
    lazyLoad: true,
    preloadViewports: 2,
    initialVisible: 3,
    showCreator: false,
    showLikes: true,
    showDuration: true,
    infiniteScroll: true,
  },
};
