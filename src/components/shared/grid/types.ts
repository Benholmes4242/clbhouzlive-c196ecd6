// Unified Media Grid Types

export type MediaOrientation = 'portrait' | 'landscape';

export interface UnifiedMediaItem {
  id: string;
  postId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  playbackUrl?: string;
  
  // Orientation & sizing
  aspectRatio?: number; // width/height ratio from media metadata
  orientation?: MediaOrientation; // Computed or explicit
  
  // Content metadata for landscape eligibility
  isFeatured?: boolean; // Explicitly featured content
  isScenic?: boolean; // Scenic/course/cinematic content
  isCinematic?: boolean; // Cinematic style content
  
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
}

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
  visibilityThreshold?: number;
}

export interface UnifiedMediaGridProps {
  items: UnifiedMediaItem[];
  config: UnifiedGridConfig;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: UnifiedMediaItem) => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
}

// Layout types
export interface LayoutRow {
  type: 'portrait-pair' | 'landscape';
  items: UnifiedMediaItem[];
}

// Constants
export const PORTRAIT_ASPECT_RATIO = 3 / 4; // 0.75
export const LANDSCAPE_ASPECT_RATIO = 16 / 9; // 1.777...
export const LANDSCAPE_AR_MIN = 1.5; // Minimum AR to be considered landscape
export const MIN_ITEMS_BETWEEN_LANDSCAPE = 6;
export const MAX_ITEMS_BETWEEN_LANDSCAPE = 10;
export const GRID_GAP_PX = 2;
