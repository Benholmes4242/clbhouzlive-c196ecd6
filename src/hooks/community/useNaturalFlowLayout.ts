/**
 * useNaturalFlowLayout - Applies consecutive limit logic to prevent visual monotony
 * 
 * Rules:
 * - Portrait: aspect ratio <= 1 (taller than wide, or square)
 * - Landscape: aspect ratio > 1 (wider than tall)
 * - Max 3 consecutive cards of the same orientation
 * - If 4th would be same, swap with next different-orientation post (lookahead: 5)
 * - If no swap candidate found, allow streak to continue (don't hide content)
 */

import { useMemo } from 'react';

export type CardOrientation = 'portrait' | 'landscape';

export interface NaturalFlowItem<T> {
  item: T;
  orientation: CardOrientation;
  originalIndex: number;
}

interface UseNaturalFlowLayoutOptions<T> {
  items: T[];
  getAspectRatio: (item: T) => number;
  maxConsecutive?: number;
  lookaheadWindow?: number;
}

/**
 * Determines orientation based on aspect ratio
 * Portrait: ratio <= 1 (includes square)
 * Landscape: ratio > 1
 */
export function getOrientation(aspectRatio: number): CardOrientation {
  return aspectRatio <= 1 ? 'portrait' : 'landscape';
}

/**
 * Applies the consecutive limit algorithm
 */
export function useNaturalFlowLayout<T>({
  items,
  getAspectRatio,
  maxConsecutive = 3,
  lookaheadWindow = 5,
}: UseNaturalFlowLayoutOptions<T>): NaturalFlowItem<T>[] {
  return useMemo(() => {
    if (!items.length) return [];

    // Build initial array with orientations
    const tagged = items.map((item, index) => ({
      item,
      orientation: getOrientation(getAspectRatio(item)),
      originalIndex: index,
      used: false,
    }));

    const result: NaturalFlowItem<T>[] = [];
    let currentStreak = 0;
    let lastOrientation: CardOrientation | null = null;

    // Process items with consecutive limit logic
    for (let i = 0; i < tagged.length; i++) {
      if (tagged[i].used) continue;

      const current = tagged[i];
      const wouldExtendStreak = lastOrientation === current.orientation;
      const wouldBreakLimit = wouldExtendStreak && currentStreak >= maxConsecutive;

      if (wouldBreakLimit) {
        // Look ahead for a different orientation
        let swapIndex = -1;
        const targetOrientation = lastOrientation === 'portrait' ? 'landscape' : 'portrait';
        
        for (let j = i + 1; j < Math.min(i + lookaheadWindow + 1, tagged.length); j++) {
          if (!tagged[j].used && tagged[j].orientation === targetOrientation) {
            swapIndex = j;
            break;
          }
        }

        if (swapIndex !== -1) {
          // Found a swap candidate - use it instead
          const swapped = tagged[swapIndex];
          result.push({
            item: swapped.item,
            orientation: swapped.orientation,
            originalIndex: swapped.originalIndex,
          });
          tagged[swapIndex].used = true;
          currentStreak = 1;
          lastOrientation = swapped.orientation;
          
          // Don't advance i - we still need to process current item
          i--;
        } else {
          // No swap candidate - allow streak to continue
          result.push({
            item: current.item,
            orientation: current.orientation,
            originalIndex: current.originalIndex,
          });
          tagged[i].used = true;
          currentStreak++;
        }
      } else {
        // Normal case - add item
        result.push({
          item: current.item,
          orientation: current.orientation,
          originalIndex: current.originalIndex,
        });
        tagged[i].used = true;
        
        if (wouldExtendStreak) {
          currentStreak++;
        } else {
          currentStreak = 1;
          lastOrientation = current.orientation;
        }
      }
    }

    return result;
  }, [items, getAspectRatio, maxConsecutive, lookaheadWindow]);
}
