/**
 * useAutoplayPattern - Determines which tiles should autoplay based on pattern
 * 
 * Patterns:
 * - center-only: Only the center/focused item (vertical feed)
 * - every-nth: Every Nth item is an autoplay candidate
 * - hero-only: Only the hero item autoplays
 * - viewport: All visible items autoplay
 * - none: No autoplay
 */

import { useCallback, useMemo } from 'react';
import { AutoplayPattern } from '../types';

interface UseAutoplayPatternOptions {
  pattern: AutoplayPattern;
  nth?: number;           // For 'every-nth' pattern
  centerIndex?: number;   // For 'center-only' pattern
  heroIndex?: number;     // For 'hero-only' pattern (usually 0)
}

interface UseAutoplayPatternResult {
  /** Check if a specific index should autoplay */
  shouldAutoplay: (index: number) => boolean;
  /** Get all autoplay candidate indices */
  getAutoplayCandidates: (totalItems: number) => number[];
}

export function useAutoplayPattern({
  pattern,
  nth = 3,
  centerIndex = 0,
  heroIndex = 0,
}: UseAutoplayPatternOptions): UseAutoplayPatternResult {
  
  const shouldAutoplay = useCallback((index: number): boolean => {
    switch (pattern) {
      case 'center-only':
        return index === centerIndex;
        
      case 'every-nth':
        // First item (0) and every nth after: 0, 3, 6, 9...
        return index % nth === 0;
        
      case 'custom':
        // Custom pattern - determined by item.isAutoplayCandidate at item level
        // Return true here; actual candidacy is set per-item
        return true;
        
      case 'hero-only':
        return index === heroIndex;
        
      case 'viewport':
        // All items are candidates (visibility determines actual playback)
        return true;
        
      case 'none':
      default:
        return false;
    }
  }, [pattern, nth, centerIndex, heroIndex]);
  
  const getAutoplayCandidates = useCallback((totalItems: number): number[] => {
    const candidates: number[] = [];
    
    switch (pattern) {
      case 'center-only':
        if (centerIndex >= 0 && centerIndex < totalItems) {
          candidates.push(centerIndex);
        }
        break;
        
      case 'every-nth':
        for (let i = 0; i < totalItems; i++) {
          if (i % nth === 0) {
            candidates.push(i);
          }
        }
        break;
        
      case 'hero-only':
        if (heroIndex >= 0 && heroIndex < totalItems) {
          candidates.push(heroIndex);
        }
        break;
        
      case 'viewport':
        // Return all indices
        for (let i = 0; i < totalItems; i++) {
          candidates.push(i);
        }
        break;
        
      case 'none':
      default:
        // Return empty array
        break;
    }
    
    return candidates;
  }, [pattern, nth, centerIndex, heroIndex]);
  
  return {
    shouldAutoplay,
    getAutoplayCandidates,
  };
}

/**
 * Mark items with autoplay candidacy based on pattern
 */
export function markAutoplayCandidates<T extends { type: string }>(
  items: T[],
  pattern: AutoplayPattern,
  nth: number = 3,
  heroIndex: number = 0
): (T & { isAutoplayCandidate: boolean; sortIndex: number })[] {
  return items.map((item, index) => {
    let isCandidate = false;
    
    if (item.type !== 'video') {
      // Images are never autoplay candidates
      isCandidate = false;
    } else {
      switch (pattern) {
        case 'center-only':
          isCandidate = false; // Center is dynamic, determined at runtime
          break;
        case 'every-nth':
          isCandidate = index % nth === 0;
          break;
        case 'custom':
          // For custom pattern, preserve existing isAutoplayCandidate if set
          isCandidate = (item as any).isAutoplayCandidate ?? false;
          break;
        case 'hero-only':
          isCandidate = index === heroIndex;
          break;
        case 'viewport':
          isCandidate = true;
          break;
        case 'none':
        default:
          isCandidate = false;
      }
    }
    
    return {
      ...item,
      isAutoplayCandidate: isCandidate,
      sortIndex: index,
    };
  });
}
