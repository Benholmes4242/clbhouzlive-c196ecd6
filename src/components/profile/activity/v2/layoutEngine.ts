// Activity Grid V2 Layout Engine
// Implements PP → L (Portrait Pair → Landscape) pattern

import { UnifiedMediaItem } from '@/components/shared/grid/types';
import {
  LayoutBlock,
  isLandscapeEligible,
  DEFAULT_ACTIVITY_GRID_CONFIG,
} from './types';

const DEBUG = false;
const log = (msg: string, data?: any) => {
  if (!DEBUG) return;
  console.log(`[LayoutEngine] ${msg}`, data || '');
};

/**
 * PP → L Block Pattern:
 * 1. Two portraits (PP) - each takes 1 column
 * 2. One landscape (L) - spans 2 columns
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
  let portraitPairsInSequence = 0; // Count of PP blocks since last L

  log('buildLayoutBlocks start', { itemCount: items.length });

  while (currentIndex < items.length) {
    // After 2 portrait pairs, look for a landscape
    const lookForLandscape = portraitPairsInSequence >= 2;

    if (lookForLandscape) {
      // Try to find a landscape-eligible item in lookahead window
      const landscapeIdx = findLandscapeCandidate(
        items, 
        usedIndices, 
        currentIndex, 
        config.landscapeLookahead
      );

      if (landscapeIdx !== null) {
        // Found landscape candidate - create landscape block
        const item = items[landscapeIdx];
        blocks.push({
          type: 'landscape',
          items: [enrichForLandscape(item)],
        });
        usedIndices.add(landscapeIdx);
        portraitPairsInSequence = 0; // Reset counter
        
        // Advance currentIndex if we used it
        if (landscapeIdx === currentIndex) {
          currentIndex++;
        }
        
        // Skip used indices
        while (currentIndex < items.length && usedIndices.has(currentIndex)) {
          currentIndex++;
        }
        continue;
      }
      
      // No landscape found - reset and continue with portraits
      portraitPairsInSequence = 0;
    }

    // Build portrait pair
    const pairItems: UnifiedMediaItem[] = [];
    
    // Get first item for pair
    while (currentIndex < items.length && usedIndices.has(currentIndex)) {
      currentIndex++;
    }
    
    if (currentIndex < items.length) {
      pairItems.push(items[currentIndex]);
      usedIndices.add(currentIndex);
      currentIndex++;
    }
    
    // Get second item for pair
    while (currentIndex < items.length && usedIndices.has(currentIndex)) {
      currentIndex++;
    }
    
    if (currentIndex < items.length) {
      pairItems.push(items[currentIndex]);
      usedIndices.add(currentIndex);
      currentIndex++;
    }

    if (pairItems.length === 2) {
      // Full portrait pair
      blocks.push({
        type: 'portrait-pair',
        items: pairItems.map(enrichForPortrait),
      });
      portraitPairsInSequence++;
    } else if (pairItems.length === 1) {
      // Lone portrait at end of feed
      if (!hasMore) {
        // No more pages - render as hero portrait (full-width)
        blocks.push({
          type: 'hero-portrait',
          items: [enrichForHeroPortrait(pairItems[0])],
        });
      } else {
        // More pages coming - still render it as portrait pair with single item
        // Grid will handle the spacing
        blocks.push({
          type: 'portrait-pair',
          items: pairItems.map(enrichForPortrait),
        });
      }
    }
    
    // Skip used indices
    while (currentIndex < items.length && usedIndices.has(currentIndex)) {
      currentIndex++;
    }
  }

  log('buildLayoutBlocks done', { blockCount: blocks.length });
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
