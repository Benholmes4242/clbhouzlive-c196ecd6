// Layout utilities for UnifiedMediaGrid
// Implements exact metadata rules for landscape vs portrait tiles

import {
  UnifiedMediaItem,
  LayoutRow,
  MediaOrientation,
  TileDisplayInfo,
  AR_LANDSCAPE_THRESHOLD,
  AR_PORTRAIT_THRESHOLD,
  LANDSCAPE_CATEGORY_SET,
  LANDSCAPE_FREQUENCY_CAP,
  LANDSCAPE_MIN_START_POSITION,
  ContentCategory,
} from './types';

// ============= Orientation Classification =============

/**
 * Classify orientation deterministically from aspect ratio
 * - Landscape: AR >= 1.25
 * - Portrait: AR <= 0.85
 * - Square: 0.85 < AR < 1.25
 */
export function classifyOrientation(aspectRatio: number | undefined): MediaOrientation {
  if (!aspectRatio || !Number.isFinite(aspectRatio)) {
    return 'portrait'; // Default fallback
  }
  
  if (aspectRatio >= AR_LANDSCAPE_THRESHOLD) {
    return 'landscape';
  }
  
  if (aspectRatio <= AR_PORTRAIT_THRESHOLD) {
    return 'portrait';
  }
  
  return 'square';
}

/**
 * Compute aspect ratio from width/height if not provided
 */
export function computeAspectRatio(item: UnifiedMediaItem): number | undefined {
  if (item.aspectRatio && Number.isFinite(item.aspectRatio)) {
    return item.aspectRatio;
  }
  
  if (item.mediaWidth && item.mediaHeight && item.mediaHeight > 0) {
    return item.mediaWidth / item.mediaHeight;
  }
  
  return undefined;
}

// ============= Landscape Eligibility =============

/**
 * Determine if an item qualifies for landscape tile display
 * 
 * Rule 1: Native landscape media (orientation === 'landscape')
 * Rule 2: Featured content override (isFeatured === true)
 * Rule 3: Category-driven emphasis (scenic, course, cinematic, flyover)
 */
export function isLandscapeEligible(item: UnifiedMediaItem): boolean {
  // Compute orientation if not set
  const aspectRatio = computeAspectRatio(item);
  const orientation = item.orientation ?? classifyOrientation(aspectRatio);
  
  // Rule 1: Native landscape media
  if (orientation === 'landscape') {
    return true;
  }
  
  // Rule 2: Featured content override
  if (item.isFeatured === true) {
    return true;
  }
  
  // Rule 3: Category-driven emphasis
  if (item.contentCategory && LANDSCAPE_CATEGORY_SET.has(item.contentCategory)) {
    return true;
  }
  
  return false;
}

// ============= Layout Building =============

interface LayoutContext {
  itemsSinceLastLandscape: number;
  lastWasLandscape: boolean;
  totalItemsPlaced: number;
}

/**
 * Check if layout constraints allow a landscape tile at current position
 * 
 * Constraint 1: Frequency cap (max 1 per 8 items)
 * Constraint 2: No back-to-back landscapes
 * Constraint 3: No landscape in first 2 tiles
 */
function canPlaceLandscape(ctx: LayoutContext): boolean {
  // Constraint 3: No landscape in first 2 tiles
  if (ctx.totalItemsPlaced < LANDSCAPE_MIN_START_POSITION) {
    return false;
  }
  
  // Constraint 2: No back-to-back
  if (ctx.lastWasLandscape) {
    return false;
  }
  
  // Constraint 1: Frequency cap
  if (ctx.itemsSinceLastLandscape < LANDSCAPE_FREQUENCY_CAP) {
    return false;
  }
  
  return true;
}

/**
 * Find the best landscape candidate in a lookahead window
 * Priority: isFeatured > category match > native landscape
 */
function findLandscapeCandidate(
  items: UnifiedMediaItem[],
  usedIndexes: Set<number>,
  startIndex: number,
  lookahead: number = 10
): number | null {
  const endIndex = Math.min(startIndex + lookahead, items.length);
  const candidates: { index: number; priority: number }[] = [];
  
  for (let j = startIndex; j < endIndex; j++) {
    if (usedIndexes.has(j)) continue;
    
    const item = items[j];
    if (!isLandscapeEligible(item)) continue;
    
    // Assign priority: lower = better
    let priority = 3; // Default: native landscape
    
    if (item.isFeatured) {
      priority = 1; // Highest priority
    } else if (item.contentCategory && LANDSCAPE_CATEGORY_SET.has(item.contentCategory)) {
      priority = 2; // Category match
    }
    
    candidates.push({ index: j, priority });
  }
  
  if (candidates.length === 0) return null;
  
  // Sort by priority and return best match
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0].index;
}

/**
 * Build layout rows from items with metadata-driven landscape placement
 * 
 * Output:
 * - Portrait tiles: 3:4, displayed in pairs (2-column)
 * - Landscape tiles: 16:9, span full width (col-span-2)
 * 
 * Constraints applied:
 * - Max 1 landscape per 8 items
 * - No back-to-back landscapes
 * - No landscape in first 2 positions
 * - If constraints block, render as portrait fallback
 */
export function buildUnifiedLayout(items: UnifiedMediaItem[]): LayoutRow[] {
  if (!items || items.length === 0) return [];
  
  const rows: LayoutRow[] = [];
  const usedIndexes = new Set<number>();
  
  const ctx: LayoutContext = {
    itemsSinceLastLandscape: LANDSCAPE_FREQUENCY_CAP, // Allow first landscape after initial window
    lastWasLandscape: false,
    totalItemsPlaced: 0,
  };
  
  let i = 0;
  
  while (i < items.length) {
    // Check if we can try to place a landscape tile
    if (canPlaceLandscape(ctx)) {
      const landscapeIdx = findLandscapeCandidate(items, usedIndexes, i, 10);
      
      if (landscapeIdx !== null) {
        const item = items[landscapeIdx];
        
        // Add tile display info
        const enrichedItem: UnifiedMediaItem = {
          ...item,
          tileDisplay: {
            tileVariant: 'landscape',
            tileSpan: 2,
            tileAspect: '16:9',
          },
        };
        
        rows.push({
          type: 'landscape',
          items: [enrichedItem],
        });
        
        usedIndexes.add(landscapeIdx);
        ctx.itemsSinceLastLandscape = 0;
        ctx.lastWasLandscape = true;
        ctx.totalItemsPlaced++;
        
        // Advance i if we used the current item
        if (landscapeIdx === i) {
          i++;
        }
        continue;
      }
    }
    
    // Build a portrait pair
    const pairItems: UnifiedMediaItem[] = [];
    
    // Find first unused item
    while (i < items.length && usedIndexes.has(i)) {
      i++;
    }
    
    if (i < items.length) {
      const item = items[i];
      const enrichedItem: UnifiedMediaItem = {
        ...item,
        tileDisplay: {
          tileVariant: 'portrait',
          tileSpan: 1,
          tileAspect: '3:4',
        },
      };
      pairItems.push(enrichedItem);
      usedIndexes.add(i);
      i++;
      ctx.itemsSinceLastLandscape++;
      ctx.totalItemsPlaced++;
    }
    
    // Find second item for the pair
    while (i < items.length && usedIndexes.has(i)) {
      i++;
    }
    
    if (i < items.length) {
      const item = items[i];
      const enrichedItem: UnifiedMediaItem = {
        ...item,
        tileDisplay: {
          tileVariant: 'portrait',
          tileSpan: 1,
          tileAspect: '3:4',
        },
      };
      pairItems.push(enrichedItem);
      usedIndexes.add(i);
      i++;
      ctx.itemsSinceLastLandscape++;
      ctx.totalItemsPlaced++;
    }
    
    if (pairItems.length > 0) {
      rows.push({
        type: 'portrait-pair',
        items: pairItems,
      });
      ctx.lastWasLandscape = false;
    }
  }
  
  return rows;
}

/**
 * Mark autoplay candidates in items array
 * ALL videos are now candidates - MediaRuntime handles visibility-based playback
 */
export function markAutoplayCandidates(items: UnifiedMediaItem[]): UnifiedMediaItem[] {
  return items.map((item, index) => {
    // Compute and set orientation
    const aspectRatio = computeAspectRatio(item);
    const orientation = classifyOrientation(aspectRatio);
    
    if (item.type !== 'video') {
      return { 
        ...item, 
        sortIndex: index,
        aspectRatio,
        orientation,
      };
    }
    
    // All videos are autoplay candidates - MediaRuntime decides based on visibility
    return {
      ...item,
      isAutoplayCandidate: true,
      sortIndex: index,
      aspectRatio,
      orientation,
    };
  });
}

/**
 * Enrich items with computed metadata
 */
export function enrichItems(items: UnifiedMediaItem[]): UnifiedMediaItem[] {
  return items.map((item, index) => {
    const aspectRatio = computeAspectRatio(item);
    const orientation = classifyOrientation(aspectRatio);
    
    return {
      ...item,
      aspectRatio,
      orientation,
      sortIndex: index,
    };
  });
}
