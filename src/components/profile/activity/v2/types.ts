// Activity Grid V2 Types
// Implements PP → L (Portrait Pair → Landscape) Clubhouse layout

import { UnifiedMediaItem } from '@/components/shared/grid/types';

// ============= Layout Block Types =============

export type BlockType = 'portrait-pair' | 'landscape' | 'hero-portrait';

export interface LayoutBlock {
  type: BlockType;
  items: UnifiedMediaItem[];
}

// ============= Aspect Ratio Classification =============

export const LANDSCAPE_AR_THRESHOLD = 1.0; // width > height = landscape eligible

/**
 * Check if an item is landscape eligible based on aspect ratio
 * Landscape = source media where width > height
 */
export function isLandscapeEligible(item: UnifiedMediaItem): boolean {
  const ar = item.aspectRatio;
  if (!ar || !Number.isFinite(ar)) return false;
  return ar > LANDSCAPE_AR_THRESHOLD;
}

// ============= Pagination Types =============

export interface ActivityPage {
  items: UnifiedMediaItem[];
  nextCursor: number;
  hasMore: boolean;
}

// ============= Grid Config =============

export interface ActivityGridV2Config {
  /** Lookahead window for landscape selection */
  landscapeLookahead: number;
  /** Page size for cursor-based pagination */
  pageSize: number;
  /** Gap between tiles in pixels */
  gapPx: number;
  /** Enable autoplay for videos */
  autoplayEnabled: boolean;
  /** Maximum concurrent autoplaying videos */
  maxAutoplay: number;
  /** Play threshold (0-1) - start playing at this visibility */
  playThreshold: number;
  /** Pause threshold (0-1) - stop playing at this visibility (hysteresis) */
  pauseThreshold: number;
  /** Show like count on tiles */
  showLikes?: boolean;
  /** Show creator name and avatar on tiles */
  showCreator?: boolean;
}

export const DEFAULT_ACTIVITY_GRID_CONFIG: ActivityGridV2Config = {
  landscapeLookahead: 5,
  pageSize: 24, // 8 blocks × 3 items
  gapPx: 3,     // Match Watch tab: 3px gap
  autoplayEnabled: true,
  maxAutoplay: 2,
  playThreshold: 0.5,    // Start playing at 50% visible (Watch tab standard)
  pauseThreshold: 0.1,   // Stop playing at 10% visible (hysteresis)
  showLikes: true,       // Show likes by default
  showCreator: false,    // Hide creator by default (profile grid shows own posts)
};
