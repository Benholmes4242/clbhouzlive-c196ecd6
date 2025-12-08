/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                      GLOBAL COLOUR SYSTEM - SINGLE SOURCE OF TRUTH                       ║
 * ║                                   "System 1"                                             ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                          ║
 * ║  This file is the ONLY place where achievement, rating, and regional colors are defined. ║
 * ║  ALL other files MUST reference this system - no local color definitions allowed.        ║
 * ║                                                                                          ║
 * ║  Three key maps:                                                                          ║
 * ║    • MILESTONE_THEMES – tiers 5, 10, 20, 50, 100, 200, 300, 400                          ║
 * ║    • COURSE_RATING_THEMES – FAIR, GOOD, VERY_GOOD, EXCELLENT, OUTSTANDING                ║
 * ║    • REGION_THEMES – WORLD (deep coastal blue), GB&I (racing green),                     ║
 * ║                      USA (red), EUROPE (EU blue)                                          ║
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
 * 
 * 3. LOCKED STATE = Universal muted palette
 *    - Background: hsl(210 15% 96%)
 *    - Icon: hsl(215 15% 65%)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * PERFORMANCE SCALE (SHARED BETWEEN ACHIEVEMENTS & RATINGS)
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 * When users learn our colour language once (low → high performance, plus four regional
 * colours), it is consistent everywhere:
 *   • Achievements & milestones
 *   • Course/community ratings
 *   • Top 100 regional journeys
 * 
 * @module GlobalAchievementMilestoneSystem
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// SYSTEM 1 – PERFORMANCE SCALE (LOW → HIGH)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const PERFORMANCE_STOPS = {
  S1: '#FBE4E4', // soft clay red      – lowest
  S2: '#F7E3C2', // sand / peach
  S3: '#E8F3C5', // yellow-green
  S4: '#CBEAD5', // light fresh green
  S5: '#B3DFC9', // richer green
  S6: '#C6E7F2', // aqua / teal-blue
  S7: '#C2D3F7', // sky / slate blue
  S8: '#D4CFDF', // soft ink/charcoal – highest card bg
} as const;

// Helper to create gradient objects
function asGradient(light: string, dark: string) {
  return {
    bgLight: light,
    bgDark: dark,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE THEMES (5 → 400 Club)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type MilestoneTier = 5 | 10 | 20 | 50 | 100 | 200 | 300 | 400;

export interface MilestoneTheme {
  id: string;
  name: string;
  tier: string;
  accent: string;    // Pure color for rings/icons
  bgLight: string;   // Card gradient start
  bgDark: string;    // Card gradient end
}

// MILESTONE COLORS
// - 5/10 Club: neutral greys (slate)
// - 20/50 Club: two friendly blues  
// - 100/200/300/400 Club: warm progression (green → gold)
export const MILESTONE_THEMES: Record<MilestoneTier, MilestoneTheme> = {
  5:   { id: 'rookie',     name: 'Rookie Club',     tier: 'ROOKIE',     ...asGradient('#E4E4E9', '#D3D3D8'),                        accent: '#0F172A' },   // neutral grey - dark slate icon
  10:  { id: 'fairway',    name: 'Fairway Club',    tier: 'FAIRWAY',    ...asGradient('#C8D5E8', '#A8B8D0'),                        accent: '#0F172A' },   // darker blue-grey - dark slate icon
  20:  { id: 'founders',   name: 'Founders Club',   tier: 'FOUNDERS',   ...asGradient('#D3E7FF', '#C1D4F5'),                        accent: '#0F172A' },   // softer blue - dark slate icon
  50:  { id: 'heritage',   name: 'Heritage Club',   tier: 'HERITAGE',   ...asGradient('#A8C4F0', '#8BAEE0'),                        accent: '#0F172A' },   // deeper blue - dark slate icon
  100: { id: 'century',    name: 'Century Club',    tier: 'CENTURY',    ...asGradient(PERFORMANCE_STOPS.S4, PERFORMANCE_STOPS.S5), accent: '#0F172A' },   // green - dark slate icon
  200: { id: 'elite',      name: 'Elite Club',      tier: 'ELITE',      ...asGradient(PERFORMANCE_STOPS.S3, PERFORMANCE_STOPS.S4), accent: '#0F172A' },   // lighter green - dark slate icon
  300: { id: 'legendary',  name: 'Legendary Club',  tier: 'LEGENDARY',  ...asGradient(PERFORMANCE_STOPS.S2, PERFORMANCE_STOPS.S1), accent: '#0F172A' },   // warm sand - dark slate icon
  400: { id: 'grandslam',  name: 'Grand Slam Club', tier: 'GRAND_SLAM', ...asGradient(PERFORMANCE_STOPS.S2, '#E8D4A0'),             accent: '#0F172A' },   // gold - dark slate icon
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COURSE RATING THEMES (Fair → Outstanding)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type RatingTier = 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT' | 'OUTSTANDING';

export interface RatingTheme {
  key: RatingTier;
  label: string;
  accent: string;    // Pure color for small elements
  bgLight: string;   // Card/badge gradient start
  bgDark: string;    // Card/badge gradient end
  // CSS class equivalents for Tailwind usage
  bgClass: string;
  borderClass: string;
  textClass: string;
  barFillClass: string;
}

/**
 * COURSE RATING THEMES
 * 
 * Rating bands are mapped to milestone club colors for visual consistency:
 * - Fair → 5 Club (Rookie) - grey/slate
 * - Good → 10 Club (Fairway) - darker blue-grey
 * - Very Good → 20 Club (Founders) - soft blue
 * - Excellent → 200 Club (Elite) - light green
 * - Outstanding → 400 Club (Grand Slam) - gold
 * 
 * All text uses dark slate (#0F172A) for consistency with milestone badges.
 */
export const COURSE_RATING_THEMES: Record<RatingTier, RatingTheme> = {
  FAIR: {
    key: 'FAIR',
    label: 'Fair',
    // Uses 5 Club (Rookie) colors
    ...asGradient(MILESTONE_THEMES[5].bgLight, MILESTONE_THEMES[5].bgDark),
    accent: MILESTONE_THEMES[5].accent, // dark slate
    bgClass: `bg-[${MILESTONE_THEMES[5].bgLight}]`,
    borderClass: 'border-slate-900',
    textClass: 'text-slate-900',
    barFillClass: 'bg-slate-400',
  },
  GOOD: {
    key: 'GOOD',
    label: 'Good',
    // Uses 10 Club (Fairway) colors
    ...asGradient(MILESTONE_THEMES[10].bgLight, MILESTONE_THEMES[10].bgDark),
    accent: MILESTONE_THEMES[10].accent, // dark slate
    bgClass: `bg-[${MILESTONE_THEMES[10].bgLight}]`,
    borderClass: 'border-slate-900',
    textClass: 'text-slate-900',
    barFillClass: 'bg-[#7B95BD]', // mid-tone blue
  },
  VERY_GOOD: {
    key: 'VERY_GOOD',
    label: 'Very Good',
    // Uses 20 Club (Founders) colors
    ...asGradient(MILESTONE_THEMES[20].bgLight, MILESTONE_THEMES[20].bgDark),
    accent: MILESTONE_THEMES[20].accent, // dark slate
    bgClass: `bg-[${MILESTONE_THEMES[20].bgLight}]`,
    borderClass: 'border-slate-900',
    textClass: 'text-slate-900',
    barFillClass: 'bg-[#6BA3E0]', // brighter blue
  },
  EXCELLENT: {
    key: 'EXCELLENT',
    label: 'Excellent',
    // Uses 200 Club (Elite) colors - light green
    ...asGradient(MILESTONE_THEMES[200].bgLight, MILESTONE_THEMES[200].bgDark),
    accent: MILESTONE_THEMES[200].accent, // dark slate
    bgClass: `bg-[${MILESTONE_THEMES[200].bgLight}]`,
    borderClass: 'border-slate-900',
    textClass: 'text-slate-900',
    barFillClass: 'bg-[#5DAF62]', // green
  },
  OUTSTANDING: {
    key: 'OUTSTANDING',
    label: 'Outstanding',
    // Uses 400 Club (Grand Slam) colors - gold
    ...asGradient(MILESTONE_THEMES[400].bgLight, MILESTONE_THEMES[400].bgDark),
    accent: MILESTONE_THEMES[400].accent, // dark slate
    bgClass: `bg-[${MILESTONE_THEMES[400].bgLight}]`,
    borderClass: 'border-slate-900',
    textClass: 'text-slate-900',
    barFillClass: 'bg-[#D4A857]', // gold
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
  accent: string;    // Pure color for icons
  bgLight: string;   // Card gradient start
  bgDark: string;    // Card gradient end
  bgLocked: string;  // Locked state background
}

export const REGION_THEMES: Record<RegionKey, RegionalTheme> = {
  WORLD: {
    id: 'list_worldwide',
    label: 'World',
    shortLabel: 'World',
    accent: '#0F172A',                 // dark slate icon
    ...asGradient('#8A9DC0', '#7D91BD'), // Deep Glacier Blue
    bgLocked: 'hsl(210 15% 96%)',
  },
  GBI: {
    id: 'list_gb_ireland',
    label: 'GB & Ireland',
    shortLabel: 'GB&I',
    accent: '#0F172A',                 // dark slate icon
    ...asGradient('#CFE8D3', '#B9D8C0'),
    bgLocked: 'hsl(140 30% 96%)',
  },
  USA: {
    id: 'list_usa',
    label: 'USA',
    shortLabel: 'USA',
    accent: '#0F172A',                 // dark slate icon
    ...asGradient('#F8D9D9', '#F2B9B9'),
    bgLocked: 'hsl(0 30% 96%)',
  },
  EUROPE: {
    id: 'list_europe',
    label: 'Europe',
    shortLabel: 'Europe',
    accent: '#0F172A',                 // dark slate icon
    ...asGradient('#D4E1FF', '#C0D3F7'),
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
  // Check direct key first (WORLD, GBI, USA, EUROPE)
  if (idOrSlug in REGION_THEMES) {
    return REGION_THEMES[idOrSlug as RegionKey];
  }
  // Check by ID (list_worldwide, list_gb_ireland, etc.)
  if (idOrSlug in REGION_THEMES_BY_ID) {
    return REGION_THEMES_BY_ID[idOrSlug];
  }
  // Check by slug (global, gb-i, usa, europe)
  if (idOrSlug in REGION_SLUG_THEMES) {
    return REGION_SLUG_THEMES[idOrSlug];
  }
  // Default to WORLD
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
  return '#D1D5DB'; // Default grey for < 5
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
  accent: string;     // Pure color for rings/icons
  bgLight: string;    // Gradient start
  bgDark: string;     // Gradient end
  bgLocked: string;   // Locked state background
  icon: string;       // Icon color (same as accent when unlocked)
}

export function getTierPalette(
  tier: string,
  unlocked: boolean
): TierPalette {
  // Locked palette is the same for all
  const lockedPalette: TierPalette = {
    accent: '#94a3b8',
    bgLight: 'hsl(210 20% 98%)',
    bgDark: 'hsl(210 15% 94%)',
    bgLocked: 'hsl(210 15% 96%)',
    icon: 'hsl(215 15% 65%)',
  };

  if (!unlocked) return lockedPalette;

  // Check if it's a milestone (numeric)
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

  // Regional list completions
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

  // Fallback
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

/**
 * Get CSS custom properties for rating bands
 * Use this to sync with index.css --rating-band-* variables
 */
export const RATING_CSS_VARS = {
  '--rating-band-outstanding': COURSE_RATING_THEMES.OUTSTANDING.accent,
  '--rating-band-excellent': COURSE_RATING_THEMES.EXCELLENT.accent,
  '--rating-band-very-good': COURSE_RATING_THEMES.VERY_GOOD.accent,
  '--rating-band-good': COURSE_RATING_THEMES.GOOD.accent,
  '--rating-band-fair': COURSE_RATING_THEMES.FAIR.accent,
} as const;
