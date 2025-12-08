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
  5:   { id: 'rookie',     name: 'Rookie Club',     tier: 'ROOKIE',     ...asGradient('#E4E4E9', '#D3D3D8'),                        accent: '#4A4A4A' },   // neutral grey
  10:  { id: 'fairway',    name: 'Fairway Club',    tier: 'FAIRWAY',    ...asGradient('#E0E3EB', '#C2C7D2'),                        accent: '#555555' },   // neutral grey
  20:  { id: 'founders',   name: 'Founders Club',   tier: 'FOUNDERS',   ...asGradient('#D3E7FF', '#C1D4F5'),                        accent: '#12355B' },   // softer blue
  50:  { id: 'heritage',   name: 'Heritage Club',   tier: 'HERITAGE',   ...asGradient('#C1D9FF', '#A8C8F5'),                        accent: '#102A5C' },   // deeper blue
  100: { id: 'century',    name: 'Century Club',    tier: 'CENTURY',    ...asGradient(PERFORMANCE_STOPS.S4, PERFORMANCE_STOPS.S5), accent: '#2F7D32' },   // green
  200: { id: 'elite',      name: 'Elite Club',      tier: 'ELITE',      ...asGradient(PERFORMANCE_STOPS.S3, PERFORMANCE_STOPS.S4), accent: '#7CC66B' },   // lighter green
  300: { id: 'legendary',  name: 'Legendary Club',  tier: 'LEGENDARY',  ...asGradient(PERFORMANCE_STOPS.S2, PERFORMANCE_STOPS.S1), accent: '#C9B27A' },   // warm sand
  400: { id: 'grandslam',  name: 'Grand Slam Club', tier: 'GRAND_SLAM', ...asGradient(PERFORMANCE_STOPS.S2, '#E8D4A0'),             accent: '#D8A546' },   // gold
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

export const COURSE_RATING_THEMES: Record<RatingTier, RatingTheme> = {
  FAIR: {
    key: 'FAIR',
    label: 'Fair',
    ...asGradient(PERFORMANCE_STOPS.S1, PERFORMANCE_STOPS.S2),
    accent: '#C05B5B',
    bgClass: `bg-[${PERFORMANCE_STOPS.S1}]`,
    borderClass: 'border-[#C05B5B]',
    textClass: 'text-[#8B3D3D]',
    barFillClass: 'bg-[#C05B5B]',
  },
  GOOD: {
    key: 'GOOD',
    label: 'Good',
    ...asGradient(PERFORMANCE_STOPS.S3, PERFORMANCE_STOPS.S4),
    accent: '#4B8C4F',
    bgClass: `bg-[${PERFORMANCE_STOPS.S3}]`,
    borderClass: 'border-[#4B8C4F]',
    textClass: 'text-[#2D5430]',
    barFillClass: 'bg-[#4B8C4F]',
  },
  VERY_GOOD: {
    key: 'VERY_GOOD',
    label: 'Very Good',
    ...asGradient(PERFORMANCE_STOPS.S4, PERFORMANCE_STOPS.S5),
    accent: '#2F7D32',
    bgClass: `bg-[${PERFORMANCE_STOPS.S4}]`,
    borderClass: 'border-[#2F7D32]',
    textClass: 'text-[#1E4D20]',
    barFillClass: 'bg-[#2F7D32]',
  },
  EXCELLENT: {
    key: 'EXCELLENT',
    label: 'Excellent',
    ...asGradient(PERFORMANCE_STOPS.S6, PERFORMANCE_STOPS.S7),
    accent: '#205D89',
    bgClass: `bg-[${PERFORMANCE_STOPS.S6}]`,
    borderClass: 'border-[#205D89]',
    textClass: 'text-[#163A55]',
    barFillClass: 'bg-[#205D89]',
  },
  OUTSTANDING: {
    key: 'OUTSTANDING',
    label: 'Outstanding',
    ...asGradient(PERFORMANCE_STOPS.S7, '#B2C2FA'),
    accent: '#163A73',
    bgClass: `bg-[${PERFORMANCE_STOPS.S7}]`,
    borderClass: 'border-[#163A73]',
    textClass: 'text-[#0F254A]',
    barFillClass: 'bg-[#163A73]',
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
    accent: '#FFFFFF',                 // white for onyx bg
    ...asGradient('#2B3038', '#1F2328'), // onyx / dark neutral
    bgLocked: 'hsl(210 15% 96%)',
  },
  GBI: {
    id: 'list_gb_ireland',
    label: 'GB & Ireland',
    shortLabel: 'GB&I',
    accent: '#063B2B',                 // dark racing green text
    ...asGradient('#CFE8D3', '#B9D8C0'),
    bgLocked: 'hsl(140 30% 96%)',
  },
  USA: {
    id: 'list_usa',
    label: 'USA',
    shortLabel: 'USA',
    accent: '#B02424',                 // bold red
    ...asGradient('#F8D9D9', '#F2B9B9'),
    bgLocked: 'hsl(0 30% 96%)',
  },
  EUROPE: {
    id: 'list_europe',
    label: 'Europe',
    shortLabel: 'Europe',
    accent: '#102A43',                 // dark EU blue text
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
