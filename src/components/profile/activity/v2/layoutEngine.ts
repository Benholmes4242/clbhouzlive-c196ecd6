// Activity Grid V2 Layout Engine
// Simplified: All tiles are uniform 3:4 portrait (matching Watch tab)

import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { LayoutBlock } from './types';

/**
 * Simplified layout: All items rendered as uniform portrait tiles
 * - No landscape hero tiles
 * - No PP → L pattern
 * - Every tile is 3:4 aspect ratio in a 2-column grid
 * 
 * This matches the Watch tab source of truth.
 */
export function buildLayoutBlocks(
  items: UnifiedMediaItem[],
  _hasMore: boolean,
  _config?: any
): LayoutBlock[] {
  if (!items || items.length === 0) {
    return [];
  }

  // Simple: every item is a portrait tile
  // We still return blocks for compatibility, but each block is a portrait-pair
  const blocks: LayoutBlock[] = [];
  
  for (let i = 0; i < items.length; i += 2) {
    const pairItems: UnifiedMediaItem[] = [];
    
    // First item
    pairItems.push(enrichForPortrait(items[i]));
    
    // Second item (if exists)
    if (i + 1 < items.length) {
      pairItems.push(enrichForPortrait(items[i + 1]));
    }
    
    blocks.push({
      type: 'portrait-pair',
      items: pairItems,
    });
  }

  return blocks;
}

// ============= Enrichment Helper =============

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
