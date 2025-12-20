// Layout utilities for UnifiedMediaGrid

import {
  UnifiedMediaItem,
  LayoutRow,
  LANDSCAPE_AR_MIN,
  MIN_ITEMS_BETWEEN_LANDSCAPE,
  MAX_ITEMS_BETWEEN_LANDSCAPE,
} from './types';

/**
 * Determine if an item should be displayed as landscape
 * Based on metadata flags OR native aspect ratio
 */
export function isLandscapeEligible(item: UnifiedMediaItem): boolean {
  // Check explicit flags first
  if (item.isFeatured || item.isScenic || item.isCinematic) {
    return true;
  }
  
  // Check native aspect ratio
  if (item.aspectRatio && item.aspectRatio >= LANDSCAPE_AR_MIN) {
    return true;
  }
  
  // Check explicit orientation
  if (item.orientation === 'landscape') {
    return true;
  }
  
  return false;
}

/**
 * Build layout rows from items
 * - Portrait cards: 3:4, displayed in pairs
 * - Landscape cards: 16:9, span full width
 * - No back-to-back landscape cards
 * - ~1 landscape every 6-10 tiles
 */
export function buildUnifiedLayout(items: UnifiedMediaItem[]): LayoutRow[] {
  if (!items || items.length === 0) return [];
  
  const rows: LayoutRow[] = [];
  const usedIndexes = new Set<number>();
  let itemsSinceLastLandscape = 0;
  let lastWasLandscape = false;
  let i = 0;
  
  while (i < items.length) {
    // Check if we should try to insert a landscape card
    const shouldTryLandscape = 
      itemsSinceLastLandscape >= MIN_ITEMS_BETWEEN_LANDSCAPE &&
      !lastWasLandscape;
    
    if (shouldTryLandscape) {
      // Look ahead for a landscape-eligible item
      const landscapeCandidate = findLandscapeCandidate(items, usedIndexes, i, 10);
      
      if (landscapeCandidate !== null) {
        rows.push({
          type: 'landscape',
          items: [items[landscapeCandidate]],
        });
        usedIndexes.add(landscapeCandidate);
        itemsSinceLastLandscape = 0;
        lastWasLandscape = true;
        
        // If we used the current item, advance i
        if (landscapeCandidate === i) {
          i++;
        }
        continue;
      }
    }
    
    // Build a portrait pair
    const pairItems: UnifiedMediaItem[] = [];
    
    // Find first unused item starting from i
    while (i < items.length && usedIndexes.has(i)) {
      i++;
    }
    
    if (i < items.length) {
      pairItems.push(items[i]);
      usedIndexes.add(i);
      i++;
      itemsSinceLastLandscape++;
    }
    
    // Find second item for the pair
    while (i < items.length && usedIndexes.has(i)) {
      i++;
    }
    
    if (i < items.length) {
      pairItems.push(items[i]);
      usedIndexes.add(i);
      i++;
      itemsSinceLastLandscape++;
    }
    
    if (pairItems.length > 0) {
      rows.push({
        type: 'portrait-pair',
        items: pairItems,
      });
      lastWasLandscape = false;
    }
  }
  
  return rows;
}

/**
 * Find a landscape-eligible item within a lookahead window
 */
function findLandscapeCandidate(
  items: UnifiedMediaItem[],
  usedIndexes: Set<number>,
  startIndex: number,
  lookahead: number
): number | null {
  const endIndex = Math.min(startIndex + lookahead, items.length);
  
  // Priority 1: Featured items
  for (let j = startIndex; j < endIndex; j++) {
    if (!usedIndexes.has(j) && items[j].isFeatured && isLandscapeEligible(items[j])) {
      return j;
    }
  }
  
  // Priority 2: Scenic/cinematic items
  for (let j = startIndex; j < endIndex; j++) {
    if (!usedIndexes.has(j) && (items[j].isScenic || items[j].isCinematic) && isLandscapeEligible(items[j])) {
      return j;
    }
  }
  
  // Priority 3: Any landscape-eligible item
  for (let j = startIndex; j < endIndex; j++) {
    if (!usedIndexes.has(j) && isLandscapeEligible(items[j])) {
      return j;
    }
  }
  
  return null;
}

/**
 * Mark autoplay candidates in items array
 * Every 3rd video becomes a candidate
 */
export function markAutoplayCandidates(items: UnifiedMediaItem[]): UnifiedMediaItem[] {
  let videoCount = 0;
  
  return items.map((item, index) => {
    if (item.type !== 'video') {
      return { ...item, sortIndex: index };
    }
    
    const isCandidate = videoCount % 3 === 0;
    videoCount++;
    
    return {
      ...item,
      isAutoplayCandidate: isCandidate,
      sortIndex: index,
    };
  });
}
