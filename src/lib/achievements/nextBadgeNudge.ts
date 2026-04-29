/**
 * Close to Next Badge - Global Nudge System
 * 
 * Determines the highest-priority "you're close" nudge for a user
 * based on their Top 100 progress across global and regional milestones.
 * 
 * ALL colors must come from globalAchievementMilestoneSystem.ts
 */

import {
  MILESTONE_THEMES,
  MilestoneTier,
  type TierPalette,
  getTierPalette,
  getRegionTheme,
} from '@/lib/globalAchievementMilestoneSystem';

// ============= Types =============

export type NudgeType = 'global' | 'regional';

export interface GlobalNudge {
  type: 'global';
  currentThreshold: number | null;
  nextThreshold: number;
  remaining: number;
  totalPlayed: number;
  tierLabel: string;
  tierName: string; // e.g., "Heritage Club"
  palette: TierPalette;
}

export interface RegionalNudge {
  type: 'regional';
  regionId: 'GBI' | 'USA' | 'EU' | 'WORLD';
  currentThreshold: number | null;
  nextThreshold: number;
  remaining: number;
  playedOnList: number;
  totalOnList: number;
  regionLabel: string;
  palette: TierPalette;
}

export type BadgeNudge = GlobalNudge | RegionalNudge;

export interface UserTop100Progress {
  totalTop100Played: number;
  lists: {
    regionId: RegionalNudge['regionId'];
    played: number;
    total: number;
  }[];
}

// ============= Constants =============

const MILESTONE_THRESHOLDS: MilestoneTier[] = [5, 10, 20, 50, 100, 200, 300, 400];

const TIER_NAMES: Record<MilestoneTier, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  200: 'Elite Club',
  300: 'Legendary Club',
  400: 'Grand Slam Club',
};

const REGION_LABELS: Record<RegionalNudge['regionId'], string> = {
  GBI: 'GB&I Top 100',
  USA: 'USA Top 100',
  EU: 'Europe Top 100',
  WORLD: 'Global Top 100',
};

const REGION_ID_TO_THEME: Record<RegionalNudge['regionId'], string> = {
  GBI: 'list_gb_ireland',
  USA: 'list_usa',
  EU: 'list_europe',
  WORLD: 'list_worldwide',
};

// ============= Helpers =============

function getCurrentGlobalTier(totalPlayed: number): MilestoneTier | null {
  for (let i = MILESTONE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPlayed >= MILESTONE_THRESHOLDS[i]) {
      return MILESTONE_THRESHOLDS[i];
    }
  }
  return null;
}

function getNextGlobalTier(totalPlayed: number): MilestoneTier | null {
  for (const t of MILESTONE_THRESHOLDS) {
    if (totalPlayed < t) {
      return t;
    }
  }
  return null;
}

// ============= Main Export =============

/**
 * Returns the single highest priority "close to next badge" nudge, or null.
 * 
 * Priority logic:
 * - Fewest remaining courses first
 * - Higher threshold wins ties
 * - Global nudges over regional nudges
 * 
 * "Close" criteria:
 * - Global: within 5 courses, OR 60%+ progress to next tier
 * - Regional: within 3 courses AND at least 5 played
 */
export function getNextBadgeNudge(progress: UserTop100Progress): BadgeNudge | null {
  const candidates: BadgeNudge[] = [];

  // Global milestones only.
  // Regional achievements (GB&I / EU / USA / WORLD sub-tiers) intentionally
  // excluded from the locked-nudge slot — per spec, they only appear in the
  // rail once EARNED. The rail's "next to unlock" slot is reserved for
  // milestone clubs (Rookie/Fairway/Founders/Heritage/Century/Elite/etc.).
  const { totalTop100Played } = progress;
  const currentTier = getCurrentGlobalTier(totalTop100Played);
  const nextThreshold = getNextGlobalTier(totalTop100Played);

  if (nextThreshold !== null) {
    const remaining = nextThreshold - totalTop100Played;
    const currentIndex = currentTier ? MILESTONE_THRESHOLDS.indexOf(currentTier) : -1;
    const prevThreshold = currentIndex >= 0 ? MILESTONE_THRESHOLDS[currentIndex] : 0;
    const gapSize = nextThreshold - prevThreshold;
    const progressInGap = totalTop100Played - prevThreshold;
    const percentProgress = gapSize > 0 ? (progressInGap / gapSize) * 100 : 0;

    // "Close" = within 5 courses OR 60%+ into the gap
    const isClose = remaining <= 5 || percentProgress >= 60;

    if (isClose && remaining > 0) {
      candidates.push({
        type: 'global',
        currentThreshold: currentTier,
        nextThreshold,
        remaining,
        totalPlayed: totalTop100Played,
        tierLabel: `${nextThreshold} Club`,
        tierName: TIER_NAMES[nextThreshold],
        palette: getTierPalette(nextThreshold.toString(), true),
      });
    }
  }

  // 2. Regional milestones
  const regionalThresholds = [10, 25, 50, 75, 100];

  for (const list of progress.lists) {
    const { played, total, regionId } = list;

    // Find current and next regional tier
    let currentRegionalTier: number | null = null;
    let nextRegionalTier: number | null = null;

    for (let i = regionalThresholds.length - 1; i >= 0; i--) {
      if (played >= regionalThresholds[i]) {
        currentRegionalTier = regionalThresholds[i];
        break;
      }
    }

    for (const t of regionalThresholds) {
      if (played < t && t <= total) {
        nextRegionalTier = t;
        break;
      }
    }

    if (!nextRegionalTier) continue;

    const remaining = nextRegionalTier - played;

    // "Close" = within 3 courses AND at least 5 played
    const isClose = remaining <= 3 && played >= 5;

    if (!isClose || remaining <= 0) continue;

    const themeId = REGION_ID_TO_THEME[regionId];
    const regionTheme = getRegionTheme(themeId);
    
    // Null-safe fallback - skip this nudge if theme resolution fails
    if (!regionTheme) {
      console.warn(`[nextBadgeNudge] Unknown region theme for: ${themeId}`);
      continue;
    }

    // All colors sourced exclusively from globalAchievementMilestoneSystem
    candidates.push({
      type: 'regional',
      regionId,
      currentThreshold: currentRegionalTier,
      nextThreshold: nextRegionalTier,
      remaining,
      playedOnList: played,
      totalOnList: total,
      regionLabel: REGION_LABELS[regionId],
      palette: {
        accent: regionTheme.accent,
        bgLight: regionTheme.bgLight,
        bgDark: regionTheme.bgDark,
        bgLocked: regionTheme.bgLocked,
        icon: regionTheme.accent,
      },
    });
  }

  if (candidates.length === 0) return null;

  // 3. Priority: fewest remaining → higher threshold → global over regional
  candidates.sort((a, b) => {
    if (a.remaining !== b.remaining) return a.remaining - b.remaining;
    if (a.nextThreshold !== b.nextThreshold) return b.nextThreshold - a.nextThreshold;
    if (a.type !== b.type) return a.type === 'global' ? -1 : 1;
    return 0;
  });

  return candidates[0];
}

/**
 * Get progress percentage between current and next tier
 */
export function getProgressToNextTier(totalPlayed: number): number {
  const currentTier = getCurrentGlobalTier(totalPlayed);
  const nextTier = getNextGlobalTier(totalPlayed);
  
  if (!nextTier) return 100;
  
  const prevThreshold = currentTier ?? 0;
  const gapSize = nextTier - prevThreshold;
  const progressInGap = totalPlayed - prevThreshold;
  
  return gapSize > 0 ? Math.min(100, (progressInGap / gapSize) * 100) : 0;
}

/**
 * Get the next milestone tier data for a given total played
 */
export function getNextMilestoneTierData(totalPlayed: number): {
  threshold: MilestoneTier;
  tierName: string;
  remaining: number;
  palette: TierPalette;
} | null {
  const nextTier = getNextGlobalTier(totalPlayed);
  if (!nextTier) return null;
  
  return {
    threshold: nextTier,
    tierName: TIER_NAMES[nextTier],
    remaining: nextTier - totalPlayed,
    palette: getTierPalette(nextTier.toString(), true),
  };
}
