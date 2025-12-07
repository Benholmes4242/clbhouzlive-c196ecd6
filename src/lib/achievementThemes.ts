/**
 * ACHIEVEMENT_THEMES - Single Source of Truth for all achievement colors
 * 
 * Every achievement UI across the app must read its bg/accent from this config:
 * - Profile Achievements rail
 * - Top 100 Milestones Modal (/achievementshub)
 * - Top 100 hub (list completions, badges you're close to)
 * - /top100/[region] pages (USA / GB&I / Europe / World achievements strips)
 * - /courses → Top 100 Club card
 * - /top100?tab=my-progress hero card
 */

export interface AchievementTheme {
  bg: string;       // Light pastel background
  bgLocked: string; // Locked/dimmed background (25-30% opacity of main)
  accent: string;   // Strong accent color for icons, borders
}

// Milestone achievements (5, 10, 20, 50, 100, 200, 300, 400)
export const MILESTONE_THEMES: Record<number, AchievementTheme> = {
  5: { 
    bg: 'hsl(43 45% 95%)',           // Warm beige / Rookie
    bgLocked: 'hsl(43 30% 96%)', 
    accent: '#C9B27A' 
  },
  10: { 
    bg: 'hsl(115 40% 95%)',          // Light soft green / Fairway
    bgLocked: 'hsl(115 30% 96%)', 
    accent: '#7CC66B' 
  },
  20: { 
    bg: 'hsl(122 35% 93%)',          // Mint / Founders
    bgLocked: 'hsl(122 30% 96%)', 
    accent: '#2F7D32' 
  },
  50: { 
    bg: 'hsl(42 60% 94%)',           // Sand / Heritage
    bgLocked: 'hsl(42 40% 96%)', 
    accent: '#D8A546' 
  },
  100: { 
    bg: 'hsl(0 0% 96%)',             // Soft grey / Century
    bgLocked: 'hsl(0 0% 96%)', 
    accent: '#4A4A4A' 
  },
  200: { 
    bg: 'hsl(250 50% 96%)',          // Lilac / Elite
    bgLocked: 'hsl(250 30% 96%)', 
    accent: '#6F5BD5' 
  },
  300: { 
    bg: 'hsl(290 45% 95%)',          // Pink / Legendary
    bgLocked: 'hsl(290 30% 96%)', 
    accent: '#B153CE' 
  },
  400: { 
    bg: 'hsl(0 0% 94%)',             // Steel / Grand Slam
    bgLocked: 'hsl(0 0% 96%)', 
    accent: '#111111' 
  },
};

// Regional list completion achievements
export const REGION_THEMES: Record<string, AchievementTheme> = {
  'list_gb_ireland': { 
    bg: 'hsl(210 50% 95%)',          // Light blue / GB&I
    bgLocked: 'hsl(210 30% 96%)', 
    accent: '#1E3A5F' 
  },
  'list_europe': { 
    bg: 'hsl(263 50% 96%)',          // Purple / Europe
    bgLocked: 'hsl(263 30% 96%)', 
    accent: '#7C3AED' 
  },
  'list_usa': { 
    bg: 'hsl(0 55% 96%)',            // Red / USA
    bgLocked: 'hsl(0 30% 96%)', 
    accent: '#B91C1C' 
  },
  'list_worldwide': { 
    bg: 'hsl(175 50% 94%)',          // Teal / World
    bgLocked: 'hsl(175 30% 96%)', 
    accent: '#0D9488' 
  },
};

// Aliases for slug-based lookups
export const REGION_SLUG_THEMES: Record<string, AchievementTheme> = {
  'global': REGION_THEMES['list_worldwide'],
  'gb-i': REGION_THEMES['list_gb_ireland'],
  'usa': REGION_THEMES['list_usa'],
  'europe': REGION_THEMES['list_europe'],
};

/**
 * Get theme for a milestone by threshold
 */
export function getMilestoneTheme(threshold: number): AchievementTheme {
  return MILESTONE_THEMES[threshold] ?? MILESTONE_THEMES[5];
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
 * Tier palette getter for AchievementBadgeCard component
 * Returns bg gradients and icon color
 */
export interface TierPalette {
  bgLight: string;
  bgDark: string;
  bgLocked: string;
  icon: string;
}

export function getTierPalette(
  tier: string,
  unlocked: boolean
): TierPalette {
  // Locked palette is the same for all
  const lockedPalette: TierPalette = {
    bgLight: 'hsl(210 20% 98%)',
    bgDark: 'hsl(210 15% 94%)',
    bgLocked: 'hsl(210 15% 96%)',
    icon: 'hsl(215 15% 65%)',
  };

  if (!unlocked) return lockedPalette;

  // Check if it's a milestone (numeric)
  const threshold = parseInt(tier, 10);
  if (!isNaN(threshold) && MILESTONE_THEMES[threshold]) {
    const theme = MILESTONE_THEMES[threshold];
    return {
      bgLight: theme.bg,
      bgDark: theme.bg.replace('95%', '88%').replace('96%', '88%').replace('94%', '86%').replace('93%', '82%'),
      bgLocked: theme.bgLocked,
      icon: theme.accent,
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
      bgLight: theme.bg,
      bgDark: theme.bg.replace('95%', '88%').replace('96%', '88%').replace('94%', '86%'),
      bgLocked: theme.bgLocked,
      icon: theme.accent,
    };
  }

  // Fallback
  return lockedPalette;
}
