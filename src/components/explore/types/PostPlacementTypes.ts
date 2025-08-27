import { ExploreContentItem } from '../types';

export interface GridItem {
  type: 'portrait' | 'square' | 'hero';
  item: ExploreContentItem;
  key: string;
  sectionIndex: number;
  row?: number;
  col?: number;
  position?: number;
  isOnRight?: boolean;
  isHeroSection?: boolean;
  heroOnRight?: boolean;
  portraitOnRight?: boolean;
}

export interface PostPlacementResult {
  gridItems: GridItem[];
  usedPostIds: Set<string>;
  totalPostsUsed: number;
}

export interface MediaQueues {
  portraitQueue: ExploreContentItem[];
  generalQueue: ExploreContentItem[];
}

export interface PlacementConfig {
  maxSections: number;
  isPortraitMedia: (item: ExploreContentItem) => boolean;
}