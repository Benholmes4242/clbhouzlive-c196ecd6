/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                      GLOBAL COLOUR SYSTEM - SINGLE SOURCE OF TRUTH                       ║
 * ║                           "Apple-Grade Unified Color Scale"                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                          ║
 * ║  This file is the ONLY place where achievement, rating, and regional colors are defined. ║
 * ║  ALL other files MUST reference this system - no local color definitions allowed.        ║
 * ║                                                                                          ║
 * ║  The Unified Color Scale:                                                                 ║
 * ║    • 8-step progression from Soft Slate (5) to Rich Masters Green (400)                  ║
 * ║    • SHARED by milestone achievements AND course ratings                                 ║
 * ║    • Premium, Apple-grade visual consistency across all surfaces                         ║
 * ║                                                                                          ║
 * ║  Three key maps:                                                                          ║
 * ║    • COLOR_SCALE – unified 8-tier color system                                           ║
 * ║    • COURSE_RATING_THEMES – FAIR→OUTSTANDING maps to the same scale                      ║
 * ║    • REGION_THEMES – WORLD (deep blue), GB&I (racing green), USA (red), EUROPE (navy)   ║
 * ║                                                                                          ║
 * ║  Key Rules:                                                                               ║
 * ║    1. Foreground accent colors match exactly across badges, bars, pills, icons           ║
 * ║    2. Background gradients use bgLight → bgDark from same tier                          ║
 * ║    3. Text auto-switches black/white based on tier brightness (≥100 = white)            ║
 * ║    4. Rating bars: fill = accent, track = #ECEFF3, no opacity blending                   ║
 * ║                                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 * 
 * @module GlobalAchievementMilestoneSystem
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// UNIFIED COLOR SCALE – 8-STEP PROGRESSION (Soft Slate Grey → Rich Masters Green)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export interface ColorTier {
  tier: number;
  accent: string;        // Used for text, icons, rating bar fill
  bgLight: string;       // Gradient start
  bgDark: string;        // Gradient end
  textOnLight: string;   // Text color on light bg
  textOnDark: string;    // Text color on dark bg
  iconBg: string;        // Background for trophy circle
}

/**
 * The official unified color scale from tier 5 → 400
 * Maps directly to: Milestone badges, Rating tiers, Avatar rings
 */
export const COLOR_SCALE = {
  rookie: {
    tier: 5,
    accent: "#A3ACBA",        // Soft Slate Grey
    bgLight: "#F5F6F8",
    bgDark: "#D4D9E2",
    textOnLight: "#111827",
    textOnDark: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)"
  },
  fairway: {
    tier: 10,
    accent: "#7C9485",        // Slate → Mint transition
    bgLight: "#E7F0EC",
    bgDark: "#C4D6CB",
    textOnLight: "#111827",
    textOnDark: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)"
  },
  founders: {
    tier: 20,
    accent: "#78B093",        // Light Mint → Soft Green
    bgLight: "#E2F4EC",
    bgDark: "#B8E3CD",
    textOnLight: "#111827",
    textOnDark: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)"
  },
  heritage: {
    tier: 50,
    accent: "#65A87C",        // Mid Fresh Green
    bgLight: "#D8F0E2",
    bgDark: "#A4D7BD",
    textOnLight: "#111827",
    textOnDark: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)"
  },
  century: {
    tier: 100,
    accent: "#4EA46D",        // Fresh Green (energetic but readable)
    bgLight: "#D1EEDD",
    bgDark: "#9CD4B6",
    textOnLight: "#FFFFFF",   // Switch to white at tier 100+
    textOnDark: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)"
  },
  elite: {
    tier: 200,
    accent: "#0F7A33",        // Masters Green (signature hero)
    bgLight: "#C7EAD2",
    bgDark: "#72C48C",
    textOnLight: "#FFFFFF",
    textOnDark: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)"
  },
  legendary: {
    tier: 300,
    accent: "#0D6C2C",        // Slightly deeper Masters Green
    bgLight: "#BEE3CA",
    bgDark: "#66B981",
    textOnLight: "#FFFFFF",
    textOnDark: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)"
  },
  grandSlam: {
    tier: 400,
    accent: "#0B5E25",        // Richest green (final tier)
    bgLight: "#B2DDBF",
    bgDark: "#5EAF77",
    textOnLight: "#FFFFFF",
    textOnDark: "#FFFFFF",
    iconBg: "rgba(255,255,255,0.22)"
  }
} as const;

/**
 * Get tier color by threshold number
 * Use this function EVERYWHERE colors are needed for milestone/rating tiers
 */
export function getTierColor(tier: number): ColorTier {
  if (tier >= 400) return COLOR_SCALE.grandSlam;
  if (tier >= 300) return COLOR_SCALE.legendary;
  if (tier >= 200) return COLOR_SCALE.elite;
  if (tier >= 100) return COLOR_SCALE.century;
  if (tier >= 50)  return COLOR_SCALE.heritage;
  if (tier >= 20)  return COLOR_SCALE.founders;
  if (tier >= 10)  return COLOR_SCALE.fairway;
  return COLOR_SCALE.rookie;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE THEMES (5 → 400 Club) – Built from COLOR_SCALE
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type MilestoneTier = 5 | 10 | 20 | 50 | 100 | 200 | 300 | 400;

export interface MilestoneTheme {
  id: string;
  name: string;
  tier: string;
  accent: string;      // Pure color for rings/icons/bar fills
  bgLight: string;     // Card gradient start
  bgDark: string;      // Card gradient end
  textOnLight: string; // Text color on light surfaces
  textOnDark: string;  // Text color on dark surfaces
  iconBg: string;      // Trophy circle background
}

// Helper to build milestone theme from color tier
function buildMilestoneTheme(
  colorTier: ColorTier,
  id: string,
  name: string,
  tierName: string
): MilestoneTheme {
  return {
    id,
    name,
    tier: tierName,
    accent: colorTier.accent,
    bgLight: colorTier.bgLight,
    bgDark: colorTier.bgDark,
    textOnLight: colorTier.textOnLight,
    textOnDark: colorTier.textOnDark,
    iconBg: colorTier.iconBg,
  };
}

export const MILESTONE_THEMES: Record<MilestoneTier, MilestoneTheme> = {
  5:   buildMilestoneTheme(COLOR_SCALE.rookie,     'rookie',     'Rookie Club',     'ROOKIE'),
  10:  buildMilestoneTheme(COLOR_SCALE.fairway,    'fairway',    'Fairway Club',    'FAIRWAY'),
  20:  buildMilestoneTheme(COLOR_SCALE.founders,   'founders',   'Founders Club',   'FOUNDERS'),
  50:  buildMilestoneTheme(COLOR_SCALE.heritage,   'heritage',   'Heritage Club',   'HERITAGE'),
  100: buildMilestoneTheme(COLOR_SCALE.century,    'century',    'Century Club',    'CENTURY'),
  200: buildMilestoneTheme(COLOR_SCALE.elite,      'elite',      'Elite Club',      'ELITE'),
  300: buildMilestoneTheme(COLOR_SCALE.legendary,  'legendary',  'Legendary Club',  'LEGENDARY'),
  400: buildMilestoneTheme(COLOR_SCALE.grandSlam,  'grandslam',  'Grand Slam Club', 'GRAND_SLAM'),
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COURSE RATING THEMES (Fair → Outstanding) – SHARES Unified Color Scale
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 
// Rating tiers map to milestone themes:
//   • Fair        → tier 5 (Rookie)
//   • Good        → tier 20 (Founders) – skip 10 for better visual differentiation
//   • Very Good   → tier 50 (Heritage)
//   • Excellent   → tier 200 (Elite)
//   • Outstanding → tier 400 (Grand Slam)

export type RatingTier = 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT' | 'OUTSTANDING';

export interface RatingTheme {
  key: RatingTier;
  label: string;
  accent: string;      // Pure color for bars/pills/icons
  bgLight: string;     // Card/badge gradient start
  bgDark: string;      // Card/badge gradient end
  textOnLight: string; // Text color on light surfaces
  textOnDark: string;  // Text color on dark surfaces
  // CSS class equivalents for Tailwind usage
  bgClass: string;
  borderClass: string;
  textClass: string;
  barFillClass: string;
}

// Build rating themes from COLOR_SCALE
export const COURSE_RATING_THEMES: Record<RatingTier, RatingTheme> = {
  FAIR: {
    key: 'FAIR',
    label: 'Fair',
    accent: COLOR_SCALE.rookie.accent,
    bgLight: COLOR_SCALE.rookie.bgLight,
    bgDark: COLOR_SCALE.rookie.bgDark,
    textOnLight: COLOR_SCALE.rookie.textOnLight,
    textOnDark: COLOR_SCALE.rookie.textOnDark,
    bgClass: `bg-[${COLOR_SCALE.rookie.bgLight}]`,
    borderClass: `border-[${COLOR_SCALE.rookie.accent}]`,
    textClass: `text-[${COLOR_SCALE.rookie.accent}]`,
    barFillClass: `bg-[${COLOR_SCALE.rookie.accent}]`,
  },
  GOOD: {
    key: 'GOOD',
    label: 'Good',
    accent: COLOR_SCALE.founders.accent,
    bgLight: COLOR_SCALE.founders.bgLight,
    bgDark: COLOR_SCALE.founders.bgDark,
    textOnLight: COLOR_SCALE.founders.textOnLight,
    textOnDark: COLOR_SCALE.founders.textOnDark,
    bgClass: `bg-[${COLOR_SCALE.founders.bgLight}]`,
    borderClass: `border-[${COLOR_SCALE.founders.accent}]`,
    textClass: `text-[${COLOR_SCALE.founders.accent}]`,
    barFillClass: `bg-[${COLOR_SCALE.founders.accent}]`,
  },
  VERY_GOOD: {
    key: 'VERY_GOOD',
    label: 'Very Good',
    accent: COLOR_SCALE.heritage.accent,
    bgLight: COLOR_SCALE.heritage.bgLight,
    bgDark: COLOR_SCALE.heritage.bgDark,
    textOnLight: COLOR_SCALE.heritage.textOnLight,
    textOnDark: COLOR_SCALE.heritage.textOnDark,
    bgClass: `bg-[${COLOR_SCALE.heritage.bgLight}]`,
    borderClass: `border-[${COLOR_SCALE.heritage.accent}]`,
    textClass: `text-[${COLOR_SCALE.heritage.accent}]`,
    barFillClass: `bg-[${COLOR_SCALE.heritage.accent}]`,
  },
  EXCELLENT: {
    key: 'EXCELLENT',
    label: 'Excellent',
    accent: COLOR_SCALE.elite.accent,
    bgLight: COLOR_SCALE.elite.bgLight,
    bgDark: COLOR_SCALE.elite.bgDark,
    textOnLight: COLOR_SCALE.elite.textOnLight,
    textOnDark: COLOR_SCALE.elite.textOnDark,
    bgClass: `bg-[${COLOR_SCALE.elite.bgLight}]`,
    borderClass: `border-[${COLOR_SCALE.elite.accent}]`,
    textClass: `text-[${COLOR_SCALE.elite.accent}]`,
    barFillClass: `bg-[${COLOR_SCALE.elite.accent}]`,
  },
  OUTSTANDING: {
    key: 'OUTSTANDING',
    label: 'Outstanding',
    accent: COLOR_SCALE.grandSlam.accent,
    bgLight: COLOR_SCALE.grandSlam.bgLight,
    bgDark: COLOR_SCALE.grandSlam.bgDark,
    textOnLight: COLOR_SCALE.grandSlam.textOnLight,
    textOnDark: COLOR_SCALE.grandSlam.textOnDark,
    bgClass: `bg-[${COLOR_SCALE.grandSlam.bgLight}]`,
    borderClass: `border-[${COLOR_SCALE.grandSlam.accent}]`,
    textClass: `text-[${COLOR_SCALE.grandSlam.accent}]`,
    barFillClass: `bg-[${COLOR_SCALE.grandSlam.accent}]`,
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
  accent: string;      // Pure color for icons
  bgLight: string;     // Card gradient start
  bgDark: string;      // Card gradient end
  bgLocked: string;    // Locked state background
}

export const REGION_THEMES: Record<RegionKey, RegionalTheme> = {
  WORLD: {
    id: 'list_worldwide',
    label: 'World',
    shortLabel: 'World',
    accent: '#124A80',           // Deep Coastal Blue (unchanged)
    bgLight: '#D7E5F7',
    bgDark: '#9AB1DA',
    bgLocked: 'hsl(210 30% 96%)',
  },
  GBI: {
    id: 'list_gb_ireland',
    label: 'GB & Ireland',
    shortLabel: 'GB&I',
    accent: '#356B3F',           // Racing Green (slightly darker)
    bgLight: '#CDE5D4',
    bgDark: '#8ABB97',
    bgLocked: 'hsl(140 30% 96%)',
  },
  USA: {
    id: 'list_usa',
    label: 'USA',
    shortLabel: 'USA',
    accent: '#B02424',           // Americana Red (unchanged)
    bgLight: '#F8D9D9',
    bgDark: '#F2B9B9',
    bgLocked: 'hsl(0 30% 96%)',
  },
  EUROPE: {
    id: 'list_europe',
    label: 'Europe',
    shortLabel: 'Europe',
    accent: '#27529B',           // Navy Blue (changed from violet)
    bgLight: '#D5DFF2',
    bgDark: '#9AB1DA',
    bgLocked: 'hsl(220 30% 96%)',
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
 * Used for: avatar rings, badge borders, trophy icons, rating bar fills
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
 * Returns accent color (NOT bgDark) for strong ring visibility
 */
export function getRingColorForThreshold(threshold: number): string {
  return MILESTONE_THEMES[threshold as MilestoneTier]?.accent ?? '#D1D5DB';
}

/**
 * Get ring color for user's highest global milestone
 * Returns accent color for strong ring visibility
 */
export function getRingColorForTotalPlayed(totalPlayed: number): string {
  const thresholds: MilestoneTier[] = [400, 300, 200, 100, 50, 20, 10, 5];
  for (const t of thresholds) {
    if (totalPlayed >= t) {
      return MILESTONE_THEMES[t].accent;
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
  accent: string;       // Pure color for rings/icons/bar fills
  bgLight: string;      // Gradient start
  bgDark: string;       // Gradient end
  bgLocked: string;     // Locked state background
  icon: string;         // Icon color (same as accent when unlocked)
  textOnLight: string;  // Text color on light surfaces
  textOnDark: string;   // Text color on dark surfaces
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
    textOnLight: '#111827',
    textOnDark: '#FFFFFF',
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
      textOnLight: theme.textOnLight,
      textOnDark: theme.textOnDark,
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
      textOnLight: '#111827',
      textOnDark: '#FFFFFF',
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

// ═══════════════════════════════════════════════════════════════════════════════════════════
// RATING BAR TRACK COLOR
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const RATING_BAR_TRACK = '#ECEFF3'; // Neutral grey track for all rating bars

// Export the color scale for reference
export { COLOR_SCALE as UNIFIED_COLOR_SCALE };
