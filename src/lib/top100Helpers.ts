// src/lib/top100Helpers.ts
// Helpers for Top 100 ring tiers and region completion stamps

import { type Top100TierId } from './top100Club';
import { getRingColorForThreshold, getRingColorForTotalPlayed } from './globalAchievementMilestoneSystem';

/**
 * Region completion stamps for profile header
 */
export type RegionStampId = 'gb-i' | 'europe' | 'usa' | 'global';

export interface CompletionStamp {
  id: RegionStampId;
  label: string;
  emoji: string;
}

const REGION_STAMPS: Record<RegionStampId, { label: string; emoji: string }> = {
  'gb-i': { label: 'GB & Ireland', emoji: '🇬🇧' },
  'europe': { label: 'Europe', emoji: '🇪🇺' },
  'usa': { label: 'USA', emoji: '🇺🇸' },
  'global': { label: 'Worldwide', emoji: '🌍' },
};

// Official list totals for completion calculation
const REGION_TOTALS: Record<RegionStampId, number> = {
  'global': 77,
  'gb-i': 100,
  'usa': 100,
  'europe': 99,
};

export interface Top100ListProgress {
  listSlug: string;
  played: number;
  total: number;
}

/**
 * Get completion stamps based on list progress
 * A region is "completed" when played === total for that list
 */
export function getCompletionStamps(lists: Top100ListProgress[] | undefined): CompletionStamp[] {
  if (!lists || lists.length === 0) return [];
  
  const stamps: CompletionStamp[] = [];
  
  for (const list of lists) {
    const regionId = list.listSlug as RegionStampId;
    const regionInfo = REGION_STAMPS[regionId];
    const officialTotal = REGION_TOTALS[regionId];
    
    if (regionInfo && officialTotal && list.played >= officialTotal) {
      stamps.push({
        id: regionId,
        label: regionInfo.label,
        emoji: regionInfo.emoji,
      });
    }
  }
  
  return stamps;
}

/**
 * Check if any region has completion progress worth showing
 */
export function hasSignificantProgress(lists: Top100ListProgress[] | undefined): boolean {
  if (!lists || lists.length === 0) return false;
  return lists.some(list => list.played > 0);
}

/**
 * Get tier ring color as CSS variable or hex
 * Uses the global achievement milestone system for colors
 */
export function getTierRingColor(tierId: Top100TierId): string {
  const threshold = getTierThreshold(tierId);
  return getRingColorForThreshold(threshold);
}

/**
 * Get the threshold for a given tier
 */
function getTierThreshold(tierId: Top100TierId): number {
  const thresholds: Record<Top100TierId, number> = {
    none: 0,
    rookie: 5,
    fairway: 10,
    founders: 20,
    heritage: 50,
    century: 100,
    elite: 200,
    legendary: 300,
    grandslam: 400,
  };
  return thresholds[tierId] || 0;
}

/**
 * Get ring gradient CSS for avatar border
 * Uses the global achievement milestone system for colors
 */
export function getRingGradientStyle(tierId: Top100TierId, totalPlayed: number): React.CSSProperties {
  if (tierId === 'none' || totalPlayed < 5) {
    return {
      background: 'linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.3) 100%)',
    };
  }
  
  const color = getRingColorForTotalPlayed(totalPlayed);
  
  // Create gradient based on tier level
  switch (tierId) {
    case 'rookie':
    case 'fairway':
      return {
        background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, 20)} 50%, ${color} 100%)`,
      };
    case 'founders':
    case 'heritage':
      return {
        background: `linear-gradient(135deg, ${adjustBrightness(color, 10)} 0%, ${color} 30%, ${adjustBrightness(color, -10)} 70%, ${color} 100%)`,
      };
    case 'century':
    case 'elite':
      // Silver/metallic gradient
      return {
        background: `linear-gradient(135deg, ${adjustBrightness(color, 30)} 0%, ${color} 25%, ${adjustBrightness(color, 40)} 50%, ${color} 75%, ${adjustBrightness(color, 20)} 100%)`,
      };
    case 'legendary':
    case 'grandslam':
      // Premium gradient with shimmer
      return {
        background: `linear-gradient(135deg, ${adjustBrightness(color, 20)} 0%, ${color} 20%, ${adjustBrightness(color, 35)} 40%, ${color} 60%, ${adjustBrightness(color, 25)} 80%, ${color} 100%)`,
      };
    default:
      return {
        background: color,
      };
  }
}

/**
 * Adjust brightness of hex color
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + Math.round(255 * (percent / 100))));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + Math.round(255 * (percent / 100))));
  const b = Math.min(255, Math.max(0, (num & 255) + Math.round(255 * (percent / 100))));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
