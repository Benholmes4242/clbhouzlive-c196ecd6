import { ActivityMediaItem } from './types';

export type LayoutRow =
  | { type: 'hero'; post: ActivityMediaItem }
  | { type: 'pair'; left: ActivityMediaItem; right?: ActivityMediaItem };

/**
 * Build a mixed hero + two-column waterfall layout
 * Heroes appear roughly every 6 posts, preferring videos/multi-media/portraits
 */
export function buildActivityLayout(items: ActivityMediaItem[]): LayoutRow[] {
  if (!items || items.length === 0) return [];
  
  const rows: LayoutRow[] = [];
  const remaining = [...items]; // Don't mutate original
  let positionCounter = 0;
  let nextHeroPosition = 0;

  while (remaining.length > 0) {
    // Try to place a hero when we've reached the next hero slot
    if (positionCounter >= nextHeroPosition && remaining.length >= 1) {
      // Look ahead up to 3 posts for a good hero candidate
      const windowEnd = Math.min(3, remaining.length);
      let heroIndex = 0;

      for (let j = 0; j < windowEnd; j++) {
        const p = remaining[j];
        const isHeroEligible = isGoodHeroCandidate(p);
        if (isHeroEligible) {
          heroIndex = j;
          break;
        }
      }

      const heroPost = remaining[heroIndex];
      rows.push({ type: 'hero', post: heroPost });
      remaining.splice(heroIndex, 1);
      
      nextHeroPosition = positionCounter + 6;
      positionCounter++;
      continue;
    }

    // Otherwise place a pair row
    const left = remaining.shift()!;
    const right = remaining.shift(); // may be undefined

    rows.push({ type: 'pair', left, right });
    positionCounter += right ? 2 : 1;
  }

  return rows;
}

/**
 * Determine if a post is a good hero candidate
 */
function isGoodHeroCandidate(item: ActivityMediaItem): boolean {
  // Videos are great heroes
  if (item.type === 'video') return true;
  
  // Multi-media posts
  if (item.additionalMediaCount && item.additionalMediaCount > 0) return true;
  
  // Milestones
  if (item.isMilestone) return true;
  
  // Portrait or square aspect (assuming square is good for hero)
  if (item.aspectRatio === 'portrait' || item.aspectRatio === 'square') return true;
  
  return false;
}
