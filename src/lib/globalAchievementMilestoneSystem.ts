/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                      GLOBAL ACHIEVEMENT & MILESTONE SYSTEM                               ║
 * ║                            SINGLE SOURCE OF TRUTH                                        ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                          ║
 * ║  This file is the ONLY place where achievement/milestone colors are defined.             ║
 * ║  ALL other files MUST reference this system - no local color definitions allowed.        ║
 * ║                                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * DESIGN RULES (MUST BE FOLLOWED BY ALL COMPONENTS)
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 * 1. RINGS & ICONS = PURE ACCENT (100% opacity, no modifiers)
 *    - Avatar rings: MILESTONE_THEMES[threshold].accent
 *    - Badge borders: MILESTONE_THEMES[threshold].accent  
 *    - Trophy icons: MILESTONE_THEMES[threshold].accent
 *    - Small pills/chips: MILESTONE_THEMES[threshold].accent
 *    - NO opacity modifiers (/85, /90, etc.)
 *    - NO color-mix for accents
 * 
 * 2. CARD BACKGROUNDS = SOFT GRADIENTS (derived from same palette)
 *    - background: linear-gradient(145deg, bgLight, bgDark)
 *    - Icon color inside cards = accent (same as ring)
 * 
 * 3. LOCKED STATE = Universal muted palette
 *    - Background: hsl(210 15% 96%)
 *    - Icon: hsl(215 15% 65%)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * SURFACES THAT MUST USE THIS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 * Avatar Rings:
 *   - Profile header avatar → getRingColorForTotalPlayed()
 *   - /top100?tab=my-progress hero avatar → getRingColorForTotalPlayed()
 *   - Top 100 Hub hero avatar → getRingColorForTotalPlayed()
 *   - Top 100 leaderboard avatars → getRingColorForTotalPlayed()
 *   - Friends on this journey avatars → getRingColorForTotalPlayed()
 *   - All SquircleAvatar ringColor props → getRingColorForTotalPlayed()
 * 
 * Achievement Cards:
 *   - Profile Achievements rail → getTierPalette()
 *   - Top 100 Milestones Modal (/achievementshub) → getTierPalette()
 *   - Top 100 hub list completions → getTierPalette()
 *   - "Badges you're close to" sections → getTierPalette()
 *   - /top100/[region] pages achievement strips → getTierPalette()
 *   - AchievementBadgeCard component → getTierPalette()
 * 
 * Badge Pills:
 *   - Top100AchievementBadge (glass pill) → getMilestoneAccent()
 *   - Milestone chips in Top 100 pages → getMilestoneAccent()
 *   - Map pins → TOP100_TIER_STYLES from top100RingStyles.ts
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * EXTENSION POLICY
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * 
 * If additional achievement types are added in the future (e.g., Skill-Based
 * Achievements, XP Tiers, Seasonal Badges), they MUST extend this system
 * rather than creating new independent styles.
 * 
 * @module GlobalAchievementMilestoneSystem
 */

export type MilestoneTier = 5 | 10 | 20 | 50 | 100 | 200 | 300 | 400;

export interface MilestoneTheme {
  id: string;
  name: string;
  accent: string;    // PRIMARY: rings, icons, borders - pure color, no opacity
  bgLight: string;   // Card gradient start
  bgDark: string;    // Card gradient end
}

// Milestone achievements (5, 10, 20, 50, 100, 200, 300, 400)
// Ring colors = accent at 100% opacity
export const MILESTONE_THEMES: Record<MilestoneTier, MilestoneTheme> = {
  5:   { id: 'rookie',     name: 'Rookie Club',     accent: '#C9B27A', bgLight: '#F8F1DE', bgDark: '#F0E0BB' },
  10:  { id: 'fairway',    name: 'Fairway Club',    accent: '#7CC66B', bgLight: '#E5F7E2', bgDark: '#C6EBBE' },
  20:  { id: 'founders',   name: 'Founders Club',   accent: '#2F7D32', bgLight: '#E0F2E0', bgDark: '#B8E0BB' },
  50:  { id: 'heritage',   name: 'Heritage Club',   accent: '#D8A546', bgLight: '#FFF3D8', bgDark: '#F6DEAA' },
  100: { id: 'century',    name: 'Century Club',    accent: '#4A4A4A', bgLight: '#F3F3F3', bgDark: '#E1E1E1' },
  200: { id: 'elite',      name: 'Elite Club',      accent: '#6F5BD5', bgLight: '#ECE9FF', bgDark: '#D2CBFF' },
  300: { id: 'legendary',  name: 'Legendary Club',  accent: '#B153CE', bgLight: '#F7E6FF', bgDark: '#E6C3FA' },
  400: { id: 'grandslam',  name: 'Grand Slam Club', accent: '#111111', bgLight: '#F0F0F0', bgDark: '#D9D9D9' },
};

// Legacy interface for backwards compatibility
export interface AchievementTheme {
  bg: string;
  bgLocked: string;
  accent: string;
}

// Regional list completion achievements
export const REGION_THEMES: Record<string, AchievementTheme> = {
  'list_gb_ireland': { 
    bg: 'hsl(210 50% 95%)',
    bgLocked: 'hsl(210 30% 96%)', 
    accent: '#1E3A5F' 
  },
  'list_europe': { 
    bg: 'hsl(263 50% 96%)',
    bgLocked: 'hsl(263 30% 96%)', 
    accent: '#7C3AED' 
  },
  'list_usa': { 
    bg: 'hsl(0 55% 96%)',
    bgLocked: 'hsl(0 30% 96%)', 
    accent: '#B91C1C' 
  },
  'list_worldwide': { 
    bg: 'hsl(175 50% 94%)',
    bgLocked: 'hsl(175 30% 96%)', 
    accent: '#0D9488' 
  },
};

// Aliases for slug-based lookups (used in list pages)
export const REGION_SLUG_THEMES: Record<string, AchievementTheme> = {
  'global': REGION_THEMES['list_worldwide'],
  'gb-i': REGION_THEMES['list_gb_ireland'],
  'usa': REGION_THEMES['list_usa'],
  'europe': REGION_THEMES['list_europe'],
};

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
 * Get theme for a regional list by achievement ID or slug
 */
export function getRegionTheme(idOrSlug: string): AchievementTheme {
  return REGION_THEMES[idOrSlug] ?? REGION_SLUG_THEMES[idOrSlug] ?? REGION_THEMES['list_worldwide'];
}

/**
 * Get theme for any achievement type
 */
export function getAchievementTheme(
  type: 'milestone' | 'list_completion',
  idOrThreshold: string | number
): AchievementTheme {
  if (type === 'milestone') {
    return getMilestoneTheme(typeof idOrThreshold === 'number' ? idOrThreshold : parseInt(idOrThreshold, 10));
  }
  return getRegionTheme(String(idOrThreshold));
}

/**
 * Get ring color for a milestone threshold
 * Returns pure accent color at 100% opacity
 */
export function getRingColorForThreshold(threshold: number): string {
  return MILESTONE_THEMES[threshold as MilestoneTier]?.accent ?? '#94a3b8';
}

/**
 * Get ring color for user's highest global milestone
 * Returns pure accent color at 100% opacity
 */
export function getRingColorForTotalPlayed(totalPlayed: number): string {
  const thresholds: MilestoneTier[] = [400, 300, 200, 100, 50, 20, 10, 5];
  for (const t of thresholds) {
    if (totalPlayed >= t) {
      return MILESTONE_THEMES[t].accent;
    }
  }
  return '#94a3b8'; // Default slate for < 5
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
      icon: theme.accent, // Icon uses pure accent
    };
  }

  // Regional list completions
  const regionMap: Record<string, string> = {
    'GBI': 'list_gb_ireland',
    'EU': 'list_europe',
    'USA': 'list_usa',
    'WORLD': 'list_worldwide',
  };

  const regionId = regionMap[tier];
  if (regionId && REGION_THEMES[regionId]) {
    const theme = REGION_THEMES[regionId];
    // Convert HSL bg to hex-friendly gradient endpoints
    return {
      accent: theme.accent,
      bgLight: theme.bg,
      bgDark: theme.bg.replace('95%', '88%').replace('96%', '88%').replace('94%', '86%'),
      bgLocked: theme.bgLocked,
      icon: theme.accent, // Icon uses pure accent
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
