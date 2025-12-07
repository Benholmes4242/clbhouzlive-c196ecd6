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
 * 1. RINGS = SOFT PASTEL (bgDark - softer color matching card appearance)
 *    - Avatar rings: use bgDark for soft pastel appearance
 *    - Map pins: use bgDark for consistency
 *    - NO pure accent for rings - they should match card appearance
 * 
 * 2. ICONS = PURE ACCENT (100% opacity, bold color)
 *    - Trophy icons inside cards: accent color
 *    - Badge icons: accent color
 * 
 * 3. CARD BACKGROUNDS = SOFT GRADIENTS (derived from same palette)
 *    - background: linear-gradient(145deg, bgLight, bgDark)
 *    - Icon color inside cards = accent (pure color)
 * 
 * 4. LOCKED STATE = Universal muted palette
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
// Ring colors = bgDark (softer pastel, matching card appearance)
// Icon/accent colors = accent (pure color for trophy icons inside cards)
export const MILESTONE_THEMES: Record<MilestoneTier, MilestoneTheme> = {
  5:   { id: 'rookie',     name: 'Rookie Club',     accent: '#C9B27A', bgLight: '#F8F1DE', bgDark: '#E8D9A8' },
  10:  { id: 'fairway',    name: 'Fairway Club',    accent: '#7CC66B', bgLight: '#E5F7E2', bgDark: '#9ED88F' },
  20:  { id: 'founders',   name: 'Founders Club',   accent: '#2F7D32', bgLight: '#E0F2E0', bgDark: '#7CB97F' },
  50:  { id: 'heritage',   name: 'Heritage Club',   accent: '#D8A546', bgLight: '#FFF3D8', bgDark: '#E8C577' },
  100: { id: 'century',    name: 'Century Club',    accent: '#4A4A4A', bgLight: '#F3F3F3', bgDark: '#B8B8B8' },
  200: { id: 'elite',      name: 'Elite Club',      accent: '#6F5BD5', bgLight: '#ECE9FF', bgDark: '#A99BE8' },
  300: { id: 'legendary',  name: 'Legendary Club',  accent: '#B153CE', bgLight: '#F7E6FF', bgDark: '#D08DE3' },
  400: { id: 'grandslam',  name: 'Grand Slam Club', accent: '#111111', bgLight: '#F0F0F0', bgDark: '#A0A0A0' },
};

// Legacy interface for backwards compatibility
export interface AchievementTheme {
  bg: string;
  bgLocked: string;
  accent: string;
}

// Regional list completion achievements
// Each has: accent (for icons), bgLight/bgDark (for card gradients and rings)
export interface RegionalTheme {
  accent: string;    // Pure color for trophy icons
  bgLight: string;   // Card gradient start (lightest)
  bgDark: string;    // Card gradient end & ring color (softer pastel)
  bgLocked: string;  // Locked state background
}

export const REGION_THEMES: Record<string, RegionalTheme> = {
  'list_gb_ireland': { 
    accent: '#1E3A5F',
    bgLight: '#E8F0F8',
    bgDark: '#7FA3C7',
    bgLocked: 'hsl(210 30% 96%)',
  },
  'list_europe': { 
    accent: '#7C3AED',
    bgLight: '#F3EEFF',
    bgDark: '#B794F4',
    bgLocked: 'hsl(263 30% 96%)',
  },
  'list_usa': { 
    accent: '#B91C1C',
    bgLight: '#FEEAEA',
    bgDark: '#F28B8B',
    bgLocked: 'hsl(0 30% 96%)',
  },
  'list_worldwide': { 
    accent: '#0D9488',
    bgLight: '#E6FAF8',
    bgDark: '#5ECED3',
    bgLocked: 'hsl(175 30% 96%)',
  },
};

// Aliases for slug-based lookups (used in list pages)
export const REGION_SLUG_THEMES: Record<string, RegionalTheme> = {
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
export function getRegionTheme(idOrSlug: string): RegionalTheme {
  return REGION_THEMES[idOrSlug] ?? REGION_SLUG_THEMES[idOrSlug] ?? REGION_THEMES['list_worldwide'];
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
    const theme = getMilestoneTheme(typeof idOrThreshold === 'number' ? idOrThreshold : parseInt(idOrThreshold, 10));
    // Convert legacy format to new format
    return {
      accent: theme.accent,
      bgLight: theme.bg,
      bgDark: theme.bg, // For legacy, use same bg
      bgLocked: theme.bgLocked,
    };
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
      return MILESTONE_THEMES[t].bgDark; // Use softer pastel color for rings
    }
  }
  return '#D1D5DB'; // Default grey for < 5
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
    return {
      accent: theme.accent,
      bgLight: theme.bgLight,
      bgDark: theme.bgDark,
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
