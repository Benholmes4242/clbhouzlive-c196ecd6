/**
 * src/lib/top100Club.ts
 * 
 * Top 100 Club tier system based on total_top100_rated.
 * 
 * IMPORTANT: Milestone thresholds are sourced from src/config/achievements.ts
 * IMPORTANT: All colors are sourced from globalAchievementMilestoneSystem.ts
 */

import { 
  ACHIEVEMENT_MILESTONES,
  MILESTONE_TIER_META,
  type MilestoneTierId,
} from '@/config/achievements';
import { 
  getRingColorForThreshold 
} from './globalAchievementMilestoneSystem';

// Re-export the tier ID type with backwards-compatible name
export type Top100TierId = MilestoneTierId;

// Glass intensity presets for badge styling
export const glassIntensity = {
  subtle: 0.16,   // very light, almost clear
  standard: 0.22, // recommended default
  vivid: 0.32,    // stronger colour
};

export type Top100ClubMeta = {
  threshold: number;
  shortLabel: string;   // numeric label e.g. "50 Club"
  tierName: string;     // user-facing name e.g. "Trailmaster"
  tierId: Top100TierId;
  glassIntensity: number; // opacity for glass badge effect
};

// Glass intensity by threshold (higher tiers get more vivid)
const GLASS_BY_THRESHOLD: Record<number, number> = {
  5: glassIntensity.subtle,
  10: glassIntensity.standard,
  20: glassIntensity.standard,
  50: glassIntensity.vivid,
  100: glassIntensity.standard,
  200: glassIntensity.vivid,
  300: glassIntensity.vivid,
  400: glassIntensity.standard,
};

/**
 * CLUB_STEPS - Derived from the single source of truth in src/config/achievements.ts
 * Ordered lowest → highest.
 * 
 * NOTE: ringColor removed - use getRingColorForThreshold(step.threshold) from globalAchievementMilestoneSystem.ts
 */
export const CLUB_STEPS: Top100ClubMeta[] = MILESTONE_TIER_META.map(meta => ({
  threshold: meta.threshold,
  shortLabel: meta.shortLabel,
  tierName: meta.tierName,
  tierId: meta.tierId,
  glassIntensity: GLASS_BY_THRESHOLD[meta.threshold] ?? glassIntensity.standard,
}));

// Lookup map for quick access by tierId
export const TIER_BY_ID: Record<Top100TierId, Top100ClubMeta | null> = {
  none: null,
  rookie: CLUB_STEPS[0],
  fairway: CLUB_STEPS[1],
  founders: CLUB_STEPS[2],
  heritage: CLUB_STEPS[3],
  century: CLUB_STEPS[4],
  elite: CLUB_STEPS[5],
  legendary: CLUB_STEPS[6],
  grandslam: CLUB_STEPS[7],
};

export type Top100ClubResult = {
  meta: Top100ClubMeta | null;
  tierId: Top100TierId;
  tierName: string | null;
  shortLabel: string | null;
  threshold: number | null;
  ringColor: string;        // Derived from global system
  glassIntensity: number;
};

// Default fallback colour for 'none' tier
const DEFAULT_RING_COLOR = '#94a3b8';
const DEFAULT_GLASS_INTENSITY = glassIntensity.subtle;

export function getTop100Club(totalPlayed: number): Top100ClubResult {
  if (totalPlayed < 5) {
    return {
      meta: null,
      tierId: 'none',
      tierName: null,
      shortLabel: null,
      threshold: null,
      ringColor: DEFAULT_RING_COLOR,
      glassIntensity: DEFAULT_GLASS_INTENSITY,
    };
  }

  let current: Top100ClubMeta | null = null;

  for (const step of CLUB_STEPS) {
    if (totalPlayed >= step.threshold) {
      current = step;
    } else {
      break;
    }
  }

  if (!current) {
    return {
      meta: null,
      tierId: 'none',
      tierName: null,
      shortLabel: null,
      threshold: null,
      ringColor: DEFAULT_RING_COLOR,
      glassIntensity: DEFAULT_GLASS_INTENSITY,
    };
  }

  // Get ring color from global system
  const ringColor = getRingColorForThreshold(current.threshold);

  return {
    meta: current,
    tierId: current.tierId,
    tierName: current.tierName,
    shortLabel: current.shortLabel,
    threshold: current.threshold,
    ringColor,
    glassIntensity: current.glassIntensity,
  };
}

export function getNextTop100Club(totalPlayed: number): Top100ClubMeta | null {
  for (const step of CLUB_STEPS) {
    if (totalPlayed < step.threshold) return step;
  }
  return null;
}

// Convert hex to translucent rgba for glass effect
export function glassTint(hex: string, opacity = glassIntensity.standard): string {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * @deprecated Use getRingColorForTotalPlayed from globalAchievementMilestoneSystem.ts
 * This function is kept for backwards compatibility only.
 */
export function getRingColorForTier(tierId: Top100TierId): string {
  const tier = TIER_BY_ID[tierId];
  if (!tier) return DEFAULT_RING_COLOR;
  return getRingColorForThreshold(tier.threshold);
}

// Backwards compatibility export (deprecated)
export type Top100Ring = Top100TierId;
