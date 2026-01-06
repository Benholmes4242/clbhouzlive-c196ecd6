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
  CLBHOUZ_ACHIEVEMENT_PALETTE,
  buildTheme,
  THEME_COLORS,
  type AchievementColorTheme,
} from './clbhouzAchievementPalette';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE THEMES (5 → 400 Club)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type MilestoneTier = 5 | 10 | 20 | 50 | 100 | 200 | 300 | 400;

export interface MilestoneTheme {
  id: string;
  name: string;
  tier: string;
  accent: string;    // Pure color for rings/icons (dark slate)
  bgLight: string;   // Card gradient start
  bgDark: string;    // Card gradient end
}

// Build themes from the unified palette
const t5   = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE.FAIR);
const t10  = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE.MILD);
const t20  = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE.STEADY);
const t50  = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE.RESPECTABLE);
const t100 = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE.GOOD);
const t200 = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE.VERY_GOOD);
const t300 = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE.EXCELLENT);
const t400 = buildTheme(CLBHOUZ_ACHIEVEMENT_PALETTE.OUTSTANDING);

export const MILESTONE_THEMES: Record<MilestoneTier, MilestoneTheme> = {
  5:   { id: 'rookie',     name: 'Rookie Club',     tier: 'ROOKIE',     bgLight: t5.bgLight,   bgDark: t5.bgDark,   accent: THEME_COLORS.icon },
  10:  { id: 'fairway',    name: 'Fairway Club',    tier: 'FAIRWAY',    bgLight: t10.bgLight,  bgDark: t10.bgDark,  accent: THEME_COLORS.icon },
  20:  { id: 'founders',   name: 'Founders Club',   tier: 'FOUNDERS',   bgLight: t20.bgLight,  bgDark: t20.bgDark,  accent: THEME_COLORS.icon },
  50:  { id: 'heritage',   name: 'Heritage Club',   tier: 'HERITAGE',   bgLight: t50.bgLight,  bgDark: t50.bgDark,  accent: THEME_COLORS.icon },
  100: { id: 'century',    name: 'Century Club',    tier: 'CENTURY',    bgLight: t100.bgLight, bgDark: t100.bgDark, accent: THEME_COLORS.icon },
  200: { id: 'elite',      name: 'Elite Club',      tier: 'ELITE',      bgLight: t200.bgLight, bgDark: t200.bgDark, accent: THEME_COLORS.icon },
  300: { id: 'legendary',  name: 'Legendary Club',  tier: 'LEGENDARY',  bgLight: t300.bgLight, bgDark: t300.bgDark, accent: THEME_COLORS.icon },
  400: { id: 'grandslam',  name: 'Grand Slam Club', tier: 'GRAND_SLAM', bgLight: t400.bgLight, bgDark: t400.bgDark, accent: THEME_COLORS.icon },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COURSE RATING THEMES (Fair → Outstanding)
// NEW COLOR SYSTEM (Jan 2026): Slate for Fair→Excellent, Gold for Outstanding only
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type RatingTier = 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT' | 'OUTSTANDING';

export interface RatingTheme {
  key: RatingTier;
  label: string;
  accent: string;    // Pure accent color (slate or gold)
  bgLight: string;   // Card/badge gradient start
  bgDark: string;    // Card/badge gradient end
  // CSS class equivalents for Tailwind usage
  bgClass: string;
  borderClass: string;
  textClass: string;
  barFillClass: string;
}

// NEW: Slate/Gold color system - no more green progression for ratings
const RATING_SLATE = '#64748B';  // slate-500
const RATING_GOLD = '#D2B461';   // trophy gold

// All non-outstanding tiers use slate styling
const slateTheme = {
  accent: RATING_SLATE,
  bgLight: '#F1F5F9',  // slate-100
  bgDark: '#E2E8F0',   // slate-200
  bgClass: 'bg-slate-100',
  borderClass: 'border-slate-200',
  textClass: 'text-slate-600',
  barFillClass: 'bg-slate-500',
};

// Outstanding uses gold styling
const goldTheme = {
  accent: RATING_GOLD,
  bgLight: '#FEF9E7',
  bgDark: '#FDF3CD',
  bgClass: 'bg-[#C9A94A]/15',
  borderClass: 'border-[#C9A94A]/40',
  textClass: 'text-[#8B7635]',
  barFillClass: 'bg-[#D2B461]',
};

export const COURSE_RATING_THEMES: Record<RatingTier, RatingTheme> = {
  FAIR: {
    key: 'FAIR',
    label: 'Fair',
    ...slateTheme,
  },
  GOOD: {
    key: 'GOOD',
    label: 'Good',
    ...slateTheme,
  },
  VERY_GOOD: {
    key: 'VERY_GOOD',
    label: 'Very Good',
    ...slateTheme,
  },
  EXCELLENT: {
    key: 'EXCELLENT',
    label: 'Excellent',
    ...slateTheme,
  },
  OUTSTANDING: {
    key: 'OUTSTANDING',
    label: 'Outstanding',
    ...goldTheme,
  },
};

/**
 * Get rating theme for a score value
 * @param score - The rating score (0-10)
 * @returns RatingTheme with all color values
 */
export function getRatingTheme(score: number): RatingTheme {
  if (score >= 9.0) return COURSE_RATING_THEMES.OUTSTANDING;
  if (score >= 8.0) return COURSE_RATING_THEMES.EXCELLENT;
  if (score >= 7.0) return COURSE_RATING_THEMES.VERY_GOOD;
  if (score >= 6.5) return COURSE_RATING_THEMES.GOOD;
  return COURSE_RATING_THEMES.FAIR;
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
    label: 'World',
    shortLabel: 'World',
    accent: THEME_COLORS.icon,
    bgLight: '#8A9DC0',
    bgDark: '#7D91BD',
    bgLocked: 'hsl(210 15% 96%)',
  },
  GBI: {
    id: 'list_gb_ireland',
    label: 'GB & Ireland',
    shortLabel: 'GB&I',
    accent: THEME_COLORS.icon,
    bgLight: '#CFE8D3',
    bgDark: '#B9D8C0',
    bgLocked: 'hsl(140 30% 96%)',
  },
  USA: {
    id: 'list_usa',
    label: 'USA',
    shortLabel: 'USA',
    accent: THEME_COLORS.icon,
    bgLight: '#F8D9D9',
    bgDark: '#F2B9B9',
    bgLocked: 'hsl(0 30% 96%)',
  },
  EUROPE: {
    id: 'list_europe',
    label: 'Europe',
    shortLabel: 'Europe',
    accent: THEME_COLORS.icon,
    bgLight: '#D4E1FF',
    bgDark: '#C0D3F7',
    bgLocked: 'hsl(225 30% 96%)',
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
 * Returns softer pastel color (bgDark) to match card appearance
 */
export function getRingColorForThreshold(threshold: number): string {
  return MILESTONE_THEMES[threshold as MilestoneTier]?.bgDark ?? '#D1D5DB';
}

/**
 * Get ring color for user's highest global milestone
 * Returns softer pastel color (bgDark) to match card appearance
 */
export function getRingColorForTotalPlayed(totalPlayed: number): string {
  const thresholds: MilestoneTier[] = [400, 300, 200, 100, 50, 20, 10, 5];
  for (const t of thresholds) {
    if (totalPlayed >= t) {
      return MILESTONE_THEMES[t].bgDark;
    }
  }
  return '#D1D5DB';
}

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
  '--rating-band-outstanding': COURSE_RATING_THEMES.OUTSTANDING.accent,
  '--rating-band-excellent': COURSE_RATING_THEMES.EXCELLENT.accent,
  '--rating-band-very-good': COURSE_RATING_THEMES.VERY_GOOD.accent,
  '--rating-band-good': COURSE_RATING_THEMES.GOOD.accent,
  '--rating-band-fair': COURSE_RATING_THEMES.FAIR.accent,
} as const;

// Re-export palette and helpers
export { CLBHOUZ_ACHIEVEMENT_PALETTE, THEME_COLORS, buildTheme } from './clbhouzAchievementPalette';
