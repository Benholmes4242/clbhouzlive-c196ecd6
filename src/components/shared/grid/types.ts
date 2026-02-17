// Unified Media Grid Types

// ============= Orientation Classification =============

export type MediaOrientation = 'portrait' | 'landscape' | 'square';

// Aspect ratio thresholds for deterministic classification
export const AR_LANDSCAPE_THRESHOLD = 1.25; // >= 1.25 = landscape
export const AR_PORTRAIT_THRESHOLD = 0.85;  // <= 0.85 = portrait
// Between 0.85 and 1.25 = square/neutral

// ============= Content Categories =============

export type ContentCategory = 
  | 'swing'
  | 'scenic'
  | 'course'
  | 'tips'
  | 'funny'
  | 'news'
  | 'highlight'
  | 'cinematic'
  | 'flyover'
  | 'other';

// Categories that trigger landscape tile display
export const LANDSCAPE_CATEGORY_SET = new Set<ContentCategory>([
  'scenic', 'course', 'cinematic', 'flyover'
]);

// ============= Tile Display Output =============

export type TileVariant = 'portrait' | 'landscape';
export type TileAspect = '3:4' | '16:9';

export interface TileDisplayInfo {
  tileVariant: TileVariant;
  tileSpan: 1 | 2; // 2 = full-width across both columns
  tileAspect: TileAspect;
}

// ============= Grid Surface Context =============

export type GridSurface = 'watch' | 'profile-activity' | 'profile' | 'grid';

// ============= Unified Media Item =============

export interface UnifiedMediaItem {
  id: string;
  postId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  playbackUrl?: string;
  
  // Media dimensions (required for orientation)
  mediaWidth?: number;
  mediaHeight?: number;
  aspectRatio?: number; // width/height - computed or stored
  
  // Computed orientation (set by layout utils)
  orientation?: MediaOrientation;
  
  // Content metadata for landscape eligibility
  isFeatured?: boolean; // Editorial or algorithmic boosting
  contentCategory?: ContentCategory;
  golfCourseId?: string; // If tagged to a course
  
  // Ranking metadata
  isPopular?: boolean; // Top X% by likes in last 24 hours
  isTrending?: boolean; // High engagement velocity in last 3-6 hours
  
  // Display data
  durationSeconds?: number | null;
  likes?: number;
  additionalMediaCount?: number;
  isMilestone?: boolean;
  courseName?: string;
  
  // Creator info
  creator?: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    verified?: boolean;
  };
  
  // Autoplay
  isAutoplayCandidate?: boolean;
  sortIndex?: number;
  
  // Studio edits (text overlays, filters, music)
  studioEdits?: any;
  
  // Filter ID for studio filters
  filterId?: string | null;
  
  // Achievement badges
  badges?: string[] | null;
  
  // Achievement post flag (non-editable posts)
  achievementId?: string | null;
  
  // Review post data (for overlay display)
  isReview?: boolean;
  reviewRating?: number;
  courseLocation?: string; // e.g. "Scotland, UK"
  sourceReviewId?: string | null;
  
  // Computed tile display (set by layout utils)
  tileDisplay?: TileDisplayInfo;
}

// ============= Grid Configuration =============

export interface UnifiedGridConfig {
  // Overlay visibility
  showCreator: boolean;
  showLikes: boolean;
  
  // Pagination
  infiniteScroll: boolean;
  pageSize?: number;
  
  // Autoplay settings
  autoplayEnabled?: boolean;
  maxAutoplay?: number;
  playThreshold?: number;     // Play when X% visible (0.4 = 40%)
  pauseThreshold?: number;    // Pause when X% invisible (0.6 = 60% out of view)
  
  // Surface context (affects tap behavior)
  surface?: GridSurface;
}

export interface UnifiedMediaGridProps {
  items: UnifiedMediaItem[];
  config: UnifiedGridConfig;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: UnifiedMediaItem, index: number) => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
}

// ============= Layout Types =============

export interface LayoutRow {
  type: 'portrait-pair' | 'landscape';
  items: UnifiedMediaItem[];
}

// ============= Layout Constants =============

export const PORTRAIT_ASPECT_RATIO = 3 / 4; // 0.75
export const LANDSCAPE_ASPECT_RATIO = 16 / 9; // 1.777...

// Landscape placement constraints
export const LANDSCAPE_FREQUENCY_CAP = 8; // Max 1 landscape per 8 items
export const LANDSCAPE_MIN_START_POSITION = 2; // No landscape in first 2 tiles

export const GRID_GAP_PX = 2;
