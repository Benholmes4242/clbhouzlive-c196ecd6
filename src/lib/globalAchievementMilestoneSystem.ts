/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                      GLOBAL COLOUR SYSTEM - SINGLE SOURCE OF TRUTH                       ║
 * ║                                   "System 1"                                             ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                          ║
 * ║  This file is the ONLY place where achievement, rating, and regional colors are defined. ║
 * ║  ALL other files MUST reference this system - no local color definitions allowed.        ║
 * ║                                                                                          ║
 * ║  All colors now source from CLBHOUZ_ACHIEVEMENT_PALETTE in clbhouzAchievementPalette.ts  ║
 * ║                                                                                          ║
 * ║  Three key maps:                                                                          ║
 * ║    • MILESTONE_THEMES – tiers 5, 10, 20, 50, 100, 200, 300, 400                          ║
 * ║    • COURSE_RATING_THEMES – FAIR, GOOD, VERY_GOOD, EXCELLENT, OUTSTANDING                 ║
 * ║    • REGION_THEMES – WORLD, GB&I, USA, EUROPE                                            ║
 * ║                                                                                          ║
 * ║  Components should only use these helpers:                                                ║
 * ║    • getTierPalette() / MILESTONE_THEMES[...]                                            ║
 * ║    • getRatingTheme(...)                                                                  ║
 * ║    • getRegionTheme(...)                                                                  ║
 * ║                                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * DESIGN RULES (MUST BE FOLLOWED BY ALL COMPONENTS)
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 * 1. CARDS & BADGES (achievement cards, rating badges, regional completion cards)
 *    - Use pastel gradients: bgLight → bgDark from the theme
 * 
 * 2. RINGS & SMALL ICONS (avatar rings, trophy icons, dots, small chips)
 *    - Use the accent color from the same theme
 *    - ALL trophy icons use THEME_COLORS.icon (dark slate), never accent
 * 
 * 3. LOCKED STATE = Universal muted palette
 *    - Background: hsl(210 15% 96%)
 *    - Icon: hsl(215 15% 65%)
 * 
 * @module GlobalAchievementMilestoneSystem
 */

import {
  ACHIEVEMENT_MILESTONES,
  MILESTONE_TIER_META,
  type AchievementMilestone,
} from '@/config/achievements';
import {
  CLBHOUZ_ACHIEVEMENT_PALETTE,
  buildTheme,
  THEME_COLORS,
  MILESTONE_PALETTE_MAP,
  getRingColorForTotalPlayed,
  type AchievementColorTheme,
} from './clbhouzAchievementPalette';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE THEMES (5 → 400 Club)
// 
// Thresholds are sourced from src/config/achievements.ts (single source of truth).
// Colors are sourced from clbhouzAchievementPalette.ts.
// ═══════════════════════════════════════════════════════════════════════════════════════════

// Re-export type for backwards compatibility
export type MilestoneTier = AchievementMilestone;

export interface MilestoneTheme {
  id: string;
  name: string;
  tier: string;
  accent: string;    // Pure color for rings/icons (dark slate)
  bgLight: string;   // Card gradient start
  bgDark: string;    // Card gradient end
}

/**
 * Build MILESTONE_THEMES dynamically from the single source of truth.
 * 
 * The mapping:
 *   5 → FAIR, 10 → MILD, 20 → STEADY, 50 → RESPECTABLE,
 *   100 → GOOD, 200 → VERY_GOOD, 300 → EXCELLENT, 400 → OUTSTANDING
 */
export const MILESTONE_THEMES: Record<MilestoneTier, MilestoneTheme> = Object.fromEntries(
  MILESTONE_TIER_META.map(meta => {
    const paletteKey = MILESTONE_PALETTE_MAP[meta.threshold];
    const theme = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE[paletteKey]);
    return [
      meta.threshold,
      {
        id: meta.tierId,
        name: meta.tierName,
        tier: meta.tierId.toUpperCase().replace('GRANDSLAM', 'GRAND_SLAM'),
        bgLight: theme.bgLight,
        bgDark: theme.bgDark,
        accent: THEME_COLORS.icon,
      },
    ];
  })
) as Record<MilestoneTier, MilestoneTheme>;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COURSE RATING THEMES (Poor → Exceptional) — 5-tier system (April 2026 rebalance)
// All tiers render amber per the unified single-color rating decision.
// Bandings: EXCEPTIONAL ≥9.0 · EXCELLENT 7.5–8.9 · GOOD 6.0–7.4 · FAIR 4.0–5.9 · POOR <4.0
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type RatingTier = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' | 'EXCEPTIONAL';

export interface RatingTheme {
  key: RatingTier;
  label: string;
  accent: string;    // Pure accent color (amber)
  bgLight: string;   // Card/badge gradient start
  bgDark: string;    // Card/badge gradient end
  // CSS class equivalents for Tailwind usage
  bgClass: string;
  borderClass: string;
  textClass: string;
  barFillClass: string;
  // Gradient
  gradient?: string;
}

// Unified amber palette — all tiers share the same visual treatment per the
// all-amber decision. Future briefs may reintroduce per-tier differentiation
// (e.g., richer gold for EXCEPTIONAL); when that happens, swap the per-tier
// constants below back to distinct theme objects.
const RATING_AMBER = '#f59e0b';
const amberTheme = {
  accent: RATING_AMBER,
  bgLight: '#f59e0b0D',
  bgDark: '#f59e0b1A',
  bgClass: 'bg-[#f59e0b]/10',
  borderClass: 'border-[#f59e0b]/30',
  textClass: 'text-[#d97706]',
  barFillClass: 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]',
  gradient: 'linear-gradient(to right, #f59e0b, #fbbf24)',
};

const poorTheme = amberTheme;
const fairTheme = amberTheme;
const goodTheme = amberTheme;
const excellentTheme = amberTheme;

export const COURSE_RATING_THEMES: Record<RatingTier, RatingTheme> = {
  POOR: {
    key: 'POOR',
    label: 'Poor',
    ...poorTheme,
  },
  FAIR: {
    key: 'FAIR',
    label: 'Fair',
    ...fairTheme,
  },
  GOOD: {
    key: 'GOOD',
    label: 'Good',
    ...goodTheme,
  },
  EXCELLENT: {
    key: 'EXCELLENT',
    label: 'Excellent',
    ...excellentTheme,
  },
  EXCEPTIONAL: {
    key: 'EXCEPTIONAL',
    label: 'Exceptional',
    ...amberTheme,
  },
};

/**
 * Get rating theme for a score value
 * @param score - The rating score (0-10)
 * @returns RatingTheme with all color values
 */
export function getRatingTheme(score: number): RatingTheme {
  if (score >= 9.0) return COURSE_RATING_THEMES.EXCEPTIONAL;
  if (score >= 7.5) return COURSE_RATING_THEMES.EXCELLENT;
  if (score >= 6.0) return COURSE_RATING_THEMES.GOOD;
  if (score >= 4.0) return COURSE_RATING_THEMES.FAIR;
  return COURSE_RATING_THEMES.POOR;
}

/**
 * Get rating theme by tier key
 */
export function getRatingThemeByKey(key: RatingTier): RatingTheme {
  return COURSE_RATING_THEMES[key];
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// REGION THEMES (Top 100 Regional Lists)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type RegionKey = 'WORLD' | 'GBI' | 'USA' | 'EUROPE';

export interface RegionalTheme {
  id: string;
  label: string;
  shortLabel: string;
  accent: string;    // Pure color for icons (dark slate)
  bgLight: string;   // Card gradient start
  bgDark: string;    // Card gradient end
  bgLocked: string;  // Locked state background
}

export const REGION_THEMES: Record<RegionKey, RegionalTheme> = {
  WORLD: {
    id: 'list_worldwide',
    label: 'Global Top 100',
    shortLabel: 'Global',
    accent: '#334E3D',  // Emerald - prestigious global
    bgLight: '#334E3D1A',     // Emerald at 10%
    bgDark: '#334E3D26',      // Emerald at 15%
    bgLocked: '#B8C6C90D',    // Sky Blue at 5%
  },
  GBI: {
    id: 'list_gb_ireland',
    label: 'GB&I Top 100',
    shortLabel: 'GB&I',
    accent: '#334E3D',  // Emerald (British racing green)
    bgLight: '#334E3D0D',     // Emerald at 5%
    bgDark: '#334E3D1A',      // Emerald at 10%
    bgLocked: '#B8C6C90D',    // Sky Blue at 5%
  },
  USA: {
    id: 'list_usa',
    label: 'USA Top 100',
    shortLabel: 'USA',
    accent: '#C1A84C',  // Chartreus - American prestige gold
    bgLight: '#C1A84C0D',     // Chartreus at 5%
    bgDark: '#C1A84C1A',      // Chartreus at 10%
    bgLocked: '#B8C6C90D',    // Sky Blue at 5%
  },
  EUROPE: {
    id: 'list_europe',
    label: 'Europe Top 100',
    shortLabel: 'Europe',
    accent: '#64748B',  // Slate - sophisticated
    bgLight: '#B8C6C90D',     // Sky Blue at 5%
    bgDark: '#B8C6C91A',      // Sky Blue at 10%
    bgLocked: '#B8C6C90D',    // Sky Blue at 5%
  },
};

// Legacy ID-based lookup for backwards compatibility
export const REGION_THEMES_BY_ID: Record<string, RegionalTheme> = {
  'list_worldwide': REGION_THEMES.WORLD,
  'list_gb_ireland': REGION_THEMES.GBI,
  'list_usa': REGION_THEMES.USA,
  'list_europe': REGION_THEMES.EUROPE,
};

// Slug-based lookup for list pages
export const REGION_SLUG_THEMES: Record<string, RegionalTheme> = {
  'global': REGION_THEMES.WORLD,
  'gb-i': REGION_THEMES.GBI,
  'usa': REGION_THEMES.USA,
  'europe': REGION_THEMES.EUROPE,
};

/**
 * Get region theme by ID, slug, or key
 */
export function getRegionTheme(idOrSlug: string): RegionalTheme {
  if (idOrSlug in REGION_THEMES) {
    return REGION_THEMES[idOrSlug as RegionKey];
  }
  if (idOrSlug in REGION_THEMES_BY_ID) {
    return REGION_THEMES_BY_ID[idOrSlug];
  }
  if (idOrSlug in REGION_SLUG_THEMES) {
    return REGION_SLUG_THEMES[idOrSlug];
  }
  return REGION_THEMES.WORLD;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// UNIFIED PALETTE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════════════════

// Legacy interface for backwards compatibility
export interface AchievementTheme {
  bg: string;
  bgLocked: string;
  accent: string;
}

/**
 * Get the pure accent color for a milestone tier
 * Used for: avatar rings, badge borders, trophy icons
 */
export function getMilestoneAccent(threshold: MilestoneTier): string {
  return MILESTONE_THEMES[threshold]?.accent ?? '#94a3b8';
}

/**
 * Get theme for a milestone by threshold
 */
export function getMilestoneTheme(threshold: number): AchievementTheme {
  const theme = MILESTONE_THEMES[threshold as MilestoneTier];
  if (theme) {
    return {
      bg: theme.bgLight,
      bgLocked: 'hsl(210 15% 96%)',
      accent: theme.accent,
    };
  }
  return { bg: 'hsl(43 45% 95%)', bgLocked: 'hsl(210 15% 96%)', accent: '#94a3b8' };
}

/**
 * Get ring color for a milestone threshold
 * Uses the unified TIER_CONFIG from clbhouzAchievementPalette.ts
 */
export function getRingColorForThreshold(threshold: number): string {
  // Use the already-imported getRingColorForTotalPlayed from clbhouzAchievementPalette
  return getRingColorForTotalPlayed(threshold);
}

/**
 * Get ring color for user's highest global milestone
 * THIS IS THE CANONICAL FUNCTION - re-exported from clbhouzAchievementPalette.ts
 * 
 * @param totalPlayed - Number of Top 100 courses played
 * @returns Hex color string for avatar ring
 */
export { getRingColorForTotalPlayed } from './clbhouzAchievementPalette';

/**
 * Get theme for any achievement type
 * Returns a unified theme with accent color
 */
export function getAchievementTheme(
  type: 'milestone' | 'list_completion',
  idOrThreshold: string | number
): { accent: string; bgLight: string; bgDark: string; bgLocked: string } {
  if (type === 'milestone') {
    const threshold = typeof idOrThreshold === 'number' ? idOrThreshold : parseInt(String(idOrThreshold), 10);
    const theme = MILESTONE_THEMES[threshold as MilestoneTier];
    if (theme) {
      return {
        accent: theme.accent,
        bgLight: theme.bgLight,
        bgDark: theme.bgDark,
        bgLocked: 'hsl(210 15% 96%)',
      };
    }
  }
  const regionTheme = getRegionTheme(String(idOrThreshold));
  return {
    accent: regionTheme.accent,
    bgLight: regionTheme.bgLight,
    bgDark: regionTheme.bgDark,
    bgLocked: regionTheme.bgLocked,
  };
}

/**
 * Tier palette getter for AchievementBadgeCard component
 * Returns explicit bg gradients and icon color from the unified system
 */
export interface TierPalette {
  accent: string;
  bgLight: string;
  bgDark: string;
  bgLocked: string;
  icon: string;
}

export function getTierPalette(
  tier: string,
  unlocked: boolean
): TierPalette {
  const lockedPalette: TierPalette = {
    accent: '#94a3b8',
    bgLight: 'hsl(210 20% 98%)',
    bgDark: 'hsl(210 15% 94%)',
    bgLocked: 'hsl(210 15% 96%)',
    icon: 'hsl(215 15% 65%)',
  };

  if (!unlocked) return lockedPalette;

  const threshold = parseInt(tier, 10) as MilestoneTier;
  if (!isNaN(threshold) && MILESTONE_THEMES[threshold]) {
    const theme = MILESTONE_THEMES[threshold];
    return {
      accent: theme.accent,
      bgLight: theme.bgLight,
      bgDark: theme.bgDark,
      bgLocked: 'hsl(210 15% 96%)',
      icon: theme.accent,
    };
  }

  const regionMap: Record<string, RegionKey> = {
    'GBI': 'GBI',
    'EU': 'EUROPE',
    'USA': 'USA',
    'WORLD': 'WORLD',
  };

  const regionKey = regionMap[tier];
  if (regionKey && REGION_THEMES[regionKey]) {
    const theme = REGION_THEMES[regionKey];
    return {
      accent: theme.accent,
      bgLight: theme.bgLight,
      bgDark: theme.bgDark,
      bgLocked: theme.bgLocked,
      icon: theme.accent,
    };
  }

  return lockedPalette;
}

/**
 * Map threshold to tier ID for backwards compatibility with top100Club
 */
export function getThresholdTierId(threshold: number): string {
  const tierMap: Record<number, string> = {
    5: 'rookie',
    10: 'fairway',
    20: 'founders',
    50: 'heritage',
    100: 'century',
    200: 'elite',
    300: 'legendary',
    400: 'grandslam',
  };
  return tierMap[threshold] ?? 'none';
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// CSS VARIABLE EXPORTS (for index.css synchronization)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const RATING_CSS_VARS = {
  '--rating-band-exceptional': COURSE_RATING_THEMES.EXCEPTIONAL.accent,
  '--rating-band-excellent':   COURSE_RATING_THEMES.EXCELLENT.accent,
  '--rating-band-good':        COURSE_RATING_THEMES.GOOD.accent,
  '--rating-band-fair':        COURSE_RATING_THEMES.FAIR.accent,
  '--rating-band-poor':        COURSE_RATING_THEMES.POOR.accent,
} as const;

// Re-export palette and helpers
export { CLBHOUZ_ACHIEVEMENT_PALETTE, THEME_COLORS, buildTheme } from './clbhouzAchievementPalette';
