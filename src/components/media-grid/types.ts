export interface MediaItem {
  id: string;
  type: 'video' | 'image';
  src: string;
  title?: string;
  alt?: string;
  user?: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
  };
  golfCourse?: {
    id: string;
    name: string;
    country: string;
  };
}

export interface MediaGridConfig {
  layout: 'discover' | 'profile' | 'modal';
  
  // Grid Structure
  columns: {
    mobile: number;    // 2-3
    tablet: number;    // 3-4  
    desktop: number;   // 4-6
  };
  
  // Spacing & Appearance
  spacing: 'tight' | 'normal' | 'loose';  // gap-px, gap-4, gap-6
  aspectRatio: 'mixed' | 'square' | 'portrait';
  
  // Features
  features: {
    heroCards: boolean;           // 2x2 featured cards
    portraitPriority: boolean;    // Complex portrait placement
    sectionBased: boolean;        // Section-based layout algorithm
    infiniteScroll: boolean;      // Pagination
    autoplay: boolean;            // Video autoplay
    badges: boolean;              // Golf course tags, user badges
    userInteractions: boolean;    // Like, follow, share
  };
  
  // Behavior
  interactions?: {
    onMediaClick?: (item: MediaItem) => void;
    onLike?: (id: string) => void;
    onFollow?: (id: string) => void;
  };
}

export interface GridLayoutItem {
  key: string;
  item: MediaItem;
  className: string;
  style?: React.CSSProperties;
}

// Preset configurations
export const GRID_PRESETS: Record<string, MediaGridConfig> = {
  modalMedia: {
    layout: 'modal',
    columns: { mobile: 3, tablet: 3, desktop: 4 },
    spacing: 'tight',
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
  }
};