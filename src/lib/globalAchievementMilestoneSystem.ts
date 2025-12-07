/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                      GLOBAL COLOUR SYSTEM - SINGLE SOURCE OF TRUTH                       ║
 * ║                            "Masters Green Ladder System"                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                          ║
 * ║  This file is the ONLY place where achievement, rating, and regional colors are defined. ║
 * ║  ALL other files MUST reference this system - no local color definitions allowed.        ║
 * ║                                                                                          ║
 * ║  The Masters Green Ladder:                                                               ║
 * ║    • 8-step green progression from Soft Mint (G1) to Grand Slam Green (G8)              ║
 * ║    • SHARED by milestone achievements AND course ratings                                 ║
 * ║                                                                                          ║
 * ║  Three key maps:                                                                          ║
 * ║    • MILESTONE_THEMES – tiers 5, 10, 20, 50, 100, 200, 300, 400 (G1-G8)                  ║
 * ║    • COURSE_RATING_THEMES – FAIR (G1), GOOD (G2), VERY_GOOD (G3),                        ║
 * ║                             EXCELLENT (G4), OUTSTANDING (G5)                             ║
 * ║    • REGION_THEMES – WORLD (teal), GB&I (racing green), USA (red), EUROPE (violet)      ║
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
 *    - Use bgDark from the same theme for visual harmony with cards
 * 
 * 3. LOCKED STATE = Universal muted palette
 *    - Background: hsl(210 15% 96%)
 *    - Icon: hsl(215 15% 65%)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * MASTERS GREEN LADDER (SHARED BETWEEN ACHIEVEMENTS & RATINGS)
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 * Users learn ONE colour language (low → high performance, plus four regional colours):
 *   • Achievements & milestones (5-400 Club)
 *   • Course/community ratings (Fair → Outstanding)
 *   • Top 100 regional journeys (keep national colours)
 * 
 * @module GlobalAchievementMilestoneSystem
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MASTERS GREEN LADDER – 8-STEP PROGRESSION
// ═══════════════════════════════════════════════════════════════════════════════════════════

const MASTERS_GREEN_LADDER = {
  5:   { accent: '#CFEBDD' }, // G1 – Soft Mint (Rookie)
  10:  { accent: '#B5E0C6' }, // G2 – Gentle Green (Fairway)
  20:  { accent: '#95D3AA' }, // G3 – Fresh Green (Founders)
  50:  { accent: '#71C18A' }, // G4 – Strong Green (Heritage)
  100: { accent: '#4AA266' }, // G5 – Masters Green (Century)
  200: { accent: '#4A9563' }, // G6 – Tour Green (Elite) – 12% lighter
  300: { accent: '#3A7751' }, // G7 – Major Green (Legendary) – 12% lighter
  400: { accent: '#2D5A42' }, // G8 – Grand Slam Green – 12% lighter
} as const;

// Helper to lighten a hex color by percentage
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100)));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

// Helper to darken a hex color by percentage
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent / 100)));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

// Build theme from accent color
interface ThemeColors {
  accent: string;
  bgLight: string;
  bgDark: string;
}

function buildThemeFromAccent(accent: string): ThemeColors {
  return {
    accent,
    bgLight: lightenColor(accent, 35), // ~35% lighter for soft gradient start
    bgDark: lightenColor(accent, 18),  // ~18% lighter for gradient end
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE THEMES (5 → 400 Club) – Built from Masters Green Ladder
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

const milestoneColors = {
  5:   buildThemeFromAccent(MASTERS_GREEN_LADDER[5].accent),
  10:  buildThemeFromAccent(MASTERS_GREEN_LADDER[10].accent),
  20:  buildThemeFromAccent(MASTERS_GREEN_LADDER[20].accent),
  50:  buildThemeFromAccent(MASTERS_GREEN_LADDER[50].accent),
  100: buildThemeFromAccent(MASTERS_GREEN_LADDER[100].accent),
  200: buildThemeFromAccent(MASTERS_GREEN_LADDER[200].accent),
  300: buildThemeFromAccent(MASTERS_GREEN_LADDER[300].accent),
  400: buildThemeFromAccent(MASTERS_GREEN_LADDER[400].accent),
};

export const MILESTONE_THEMES: Record<MilestoneTier, MilestoneTheme> = {
  5:   { id: 'rookie',     name: 'Rookie Club',     tier: 'ROOKIE',     ...milestoneColors[5] },
  10:  { id: 'fairway',    name: 'Fairway Club',    tier: 'FAIRWAY',    ...milestoneColors[10] },
  20:  { id: 'founders',   name: 'Founders Club',   tier: 'FOUNDERS',   ...milestoneColors[20] },
  50:  { id: 'heritage',   name: 'Heritage Club',   tier: 'HERITAGE',   ...milestoneColors[50] },
  100: { id: 'century',    name: 'Century Club',    tier: 'CENTURY',    ...milestoneColors[100] },
  200: { id: 'elite',      name: 'Elite Club',      tier: 'ELITE',      ...milestoneColors[200] },
  300: { id: 'legendary',  name: 'Legendary Club',  tier: 'LEGENDARY',  ...milestoneColors[300] },
  400: { id: 'grandslam',  name: 'Grand Slam Club', tier: 'GRAND_SLAM', ...milestoneColors[400] },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COURSE RATING THEMES (Fair → Outstanding) – SHARES Masters Green Ladder
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 
// Rating tiers map to milestone themes:
//   • Fair        → 5-Club theme (G1)
//   • Good        → 10-Club theme (G2)
//   • Very Good   → 20-Club theme (G3)
//   • Excellent   → 50-Club theme (G4)
//   • Outstanding → 100-Club theme (G5)

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

// Build rating themes from milestone themes (shared ladder)
export const COURSE_RATING_THEMES: Record<RatingTier, RatingTheme> = {
  FAIR: {
    key: 'FAIR',
    label: 'Fair',
    accent: milestoneColors[5].accent,
    bgLight: milestoneColors[5].bgLight,
    bgDark: milestoneColors[5].bgDark,
    bgClass: `bg-[${milestoneColors[5].bgLight}]`,
    borderClass: `border-[${milestoneColors[5].accent}]`,
    textClass: `text-[${darkenColor(milestoneColors[5].accent, 30)}]`,
    barFillClass: `bg-[${milestoneColors[5].accent}]`,
  },
  GOOD: {
    key: 'GOOD',
    label: 'Good',
    accent: milestoneColors[10].accent,
    bgLight: milestoneColors[10].bgLight,
    bgDark: milestoneColors[10].bgDark,
    bgClass: `bg-[${milestoneColors[10].bgLight}]`,
    borderClass: `border-[${milestoneColors[10].accent}]`,
    textClass: `text-[${darkenColor(milestoneColors[10].accent, 30)}]`,
    barFillClass: `bg-[${milestoneColors[10].accent}]`,
  },
  VERY_GOOD: {
    key: 'VERY_GOOD',
    label: 'Very Good',
    accent: milestoneColors[20].accent,
    bgLight: milestoneColors[20].bgLight,
    bgDark: milestoneColors[20].bgDark,
    bgClass: `bg-[${milestoneColors[20].bgLight}]`,
    borderClass: `border-[${milestoneColors[20].accent}]`,
    textClass: `text-[${darkenColor(milestoneColors[20].accent, 30)}]`,
    barFillClass: `bg-[${milestoneColors[20].accent}]`,
  },
  EXCELLENT: {
    key: 'EXCELLENT',
    label: 'Excellent',
    accent: milestoneColors[50].accent,
    bgLight: milestoneColors[50].bgLight,
    bgDark: milestoneColors[50].bgDark,
    bgClass: `bg-[${milestoneColors[50].bgLight}]`,
    borderClass: `border-[${milestoneColors[50].accent}]`,
    textClass: `text-[${darkenColor(milestoneColors[50].accent, 30)}]`,
    barFillClass: `bg-[${milestoneColors[50].accent}]`,
  },
  OUTSTANDING: {
    key: 'OUTSTANDING',
    label: 'Outstanding',
    accent: milestoneColors[100].accent,
    bgLight: milestoneColors[100].bgLight,
    bgDark: milestoneColors[100].bgDark,
    bgClass: `bg-[${milestoneColors[100].bgLight}]`,
    borderClass: `border-[${milestoneColors[100].accent}]`,
    textClass: `text-[${darkenColor(milestoneColors[100].accent, 30)}]`,
    barFillClass: `bg-[${milestoneColors[100].accent}]`,
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
    accent: '#124A80',                 // deep coastal blue
    bgLight: '#D7E5F7',
    bgDark: '#C3D5F0',
    bgLocked: 'hsl(210 30% 96%)',
  },
  GBI: {
    id: 'list_gb_ireland',
    label: 'GB & Ireland',
    shortLabel: 'GB&I',
    accent: '#2E6B4A',                 // slightly deeper racing green
    bgLight: '#C0D9CB',
    bgDark: '#A8CBBA',
    bgLocked: 'hsl(140 30% 96%)',
  },
  USA: {
    id: 'list_usa',
    label: 'USA',
    shortLabel: 'USA',
    accent: '#B02424',                 // bold red (unchanged)
    bgLight: '#F8D9D9',
    bgDark: '#F2B9B9',
    bgLocked: 'hsl(0 30% 96%)',
  },
  EUROPE: {
    id: 'list_europe',
    label: 'Europe',
    shortLabel: 'Europe',
    accent: '#1F3A93',                 // Navy Blue
    bgLight: '#D6DDF2',                // Light navy mist
    bgDark: '#C4CEE9',
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
 * Returns pastel color (bgDark) to match card appearance
 */
export function getRingColorForThreshold(threshold: number): string {
  return MILESTONE_THEMES[threshold as MilestoneTier]?.bgDark ?? '#D1D5DB';
}

/**
 * Get ring color for user's highest global milestone
 * Returns pastel color (bgDark) to match card appearance
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

// ═══════════════════════════════════════════════════════════════════════════════════════════
// RATING BAR TRACK COLOR
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const RATING_BAR_TRACK = '#E2E7EC'; // Neutral grey track for all rating bars

// Export the ladder for reference
export { MASTERS_GREEN_LADDER };
