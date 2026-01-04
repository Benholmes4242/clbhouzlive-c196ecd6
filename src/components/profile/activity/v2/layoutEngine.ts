// Activity Grid V2 Layout Engine
// Implements PP → L (Portrait Pair → Landscape) pattern

import { UnifiedMediaItem } from '@/components/shared/grid/types';
import {
  LayoutBlock,
  isLandscapeEligible,
  DEFAULT_ACTIVITY_GRID_CONFIG,
} from './types';

/**
 * PP → L Block Pattern:
 * 1. Two portraits (PP) - each takes 1 column
 * 2. One landscape (L) - spans 2 columns (immediately after each PP)
 * 3. Repeat
 * 
 * If no landscape-eligible item exists in lookahead window,
 * continue with portrait pairs.
 * 
 * End-of-feed rule: lone portrait becomes full-width hero
 */
export function buildLayoutBlocks(
  items: UnifiedMediaItem[],
  hasMore: boolean,
  config = DEFAULT_ACTIVITY_GRID_CONFIG
): LayoutBlock[] {
  if (!items || items.length === 0) {
    return [];
  }

  const blocks: LayoutBlock[] = [];
  const usedIndices = new Set<number>();
  let currentIndex = 0;

  while (currentIndex < items.length) {
    // STEP 1: Build a portrait pair (PP)
    const pairItems: UnifiedMediaItem[] = [];
    
    // Get first portrait
    while (currentIndex < items.length && usedIndices.has(currentIndex)) {
      currentIndex++;
    }
    
    if (currentIndex < items.length) {
      pairItems.push(items[currentIndex]);
      usedIndices.add(currentIndex);
      currentIndex++;
    }
    
    // Get second portrait
    while (currentIndex < items.length && usedIndices.has(currentIndex)) {
      currentIndex++;
    }
    
    if (currentIndex < items.length) {
      pairItems.push(items[currentIndex]);
      usedIndices.add(currentIndex);
      currentIndex++;
    }

    // Add the portrait pair block
    if (pairItems.length === 2) {
      blocks.push({
        type: 'portrait-pair',
        items: pairItems.map(enrichForPortrait),
      });
    } else if (pairItems.length === 1) {
      // Lone portrait at end
      if (!hasMore) {
        // No more pages - render as hero portrait (full-width)
        blocks.push({
          type: 'hero-portrait',
          items: [enrichForHeroPortrait(pairItems[0])],
        });
      } else {
        // More pages coming - render as single-item portrait pair
        blocks.push({
          type: 'portrait-pair',
          items: pairItems.map(enrichForPortrait),
        });
      }
      break; // Exit loop, nothing more to process
    } else {
      // No items left
      break;
    }

    // STEP 2: Immediately look for a landscape (L) after EACH portrait pair
    // This creates PP → L pattern, not PP → PP → L
    const landscapeIdx = findLandscapeCandidate(
      items,
      usedIndices,
      currentIndex,
      config.landscapeLookahead
    );

    if (landscapeIdx !== null) {
      // Found landscape - add it
      const item = items[landscapeIdx];
      blocks.push({
        type: 'landscape',
        items: [enrichForLandscape(item)],
      });
      usedIndices.add(landscapeIdx);
      
      // If landscape was at current position, advance
      if (landscapeIdx === currentIndex) {
        currentIndex++;
      }
    }
    
    // If no landscape found, that's fine - continue with next portrait pair
    // This naturally handles all-portrait feeds
    
    // Skip any used indices
    while (currentIndex < items.length && usedIndices.has(currentIndex)) {
      currentIndex++;
    }
  }

  return blocks;
}

// ============= Helpers =============

function findLandscapeCandidate(
  items: UnifiedMediaItem[],
  usedIndices: Set<number>,
  startIndex: number,
  lookahead: number
): number | null {
  const endIndex = Math.min(startIndex + lookahead, items.length);
  
  for (let i = startIndex; i < endIndex; i++) {
    if (usedIndices.has(i)) continue;
    if (isLandscapeEligible(items[i])) {
      return i;
    }
  }
  
  return null;
}

// ============= Enrichment Helpers =============

function enrichForPortrait(item: UnifiedMediaItem): UnifiedMediaItem {
  return {
    ...item,
    tileDisplay: {
      tileVariant: 'portrait',
      tileSpan: 1,
      tileAspect: '3:4',
    },
  };
}

function enrichForLandscape(item: UnifiedMediaItem): UnifiedMediaItem {
  return {
    ...item,
    tileDisplay: {
      tileVariant: 'landscape',
      tileSpan: 2,
      tileAspect: '16:9',
    },
  };
}

function enrichForHeroPortrait(item: UnifiedMediaItem): UnifiedMediaItem {
  return {
    ...item,
    tileDisplay: {
      tileVariant: 'portrait', // Still portrait aspect ratio
      tileSpan: 2, // But spans full width
      tileAspect: '3:4',
    },
  };
}
