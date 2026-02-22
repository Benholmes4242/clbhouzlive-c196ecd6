/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                     CLBHOUZ ACHIEVEMENT & RATING PALETTE                                 ║
 * ║                          Single Source of Truth                                          ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                          ║
 * ║  This file defines the TIER_CONFIG and palette used across:                              ║
 * ║    • Milestone Clubs (5 → 400)                                                           ║
 * ║    • Avatar Rings                                                                        ║
 * ║    • Progress Bars                                                                       ║
 * ║    • Course Ratings (Fair → Outstanding)                                                 ║
 * ║                                                                                          ║
 * ║  NO hard-coded hexes for milestones or rating bars anywhere else.                        ║
 * ║  Everything must come through this file + the mappings in globalAchievementMilestoneSystem║
 * ║                                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TIER CONFIG - SINGLE SOURCE OF TRUTH FOR ALL AVATAR RINGS & PROGRESS BARS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export interface TierConfigEntry {
  threshold: number;
  name: string | null;
  color: string;
  paletteKey: ClbhouzAchievementKey | 'NONE';
}

export const TIER_CONFIG = {
  0: { threshold: 0, name: null, color: '#B8C6C9', paletteKey: 'NONE' as const },
  1: { threshold: 5, name: 'Rookie Club', color: '#B8C6C9', paletteKey: 'FAIR' as const },
  2: { threshold: 10, name: 'Fairway Club', color: '#9AB0A3', paletteKey: 'MILD' as const },
  3: { threshold: 20, name: 'Founders Club', color: '#E5D0A1', paletteKey: 'STEADY' as const },
  4: { threshold: 50, name: 'Heritage Club', color: '#7A9E7A', paletteKey: 'RESPECTABLE' as const },
  5: { threshold: 100, name: 'Century Club', color: '#5A8A5A', paletteKey: 'GOOD' as const },
  6: { threshold: 200, name: 'Elite Club', color: '#4A7A4A', paletteKey: 'VERY_GOOD' as const },
  7: { threshold: 300, name: 'Legendary Club', color: '#334E3D', paletteKey: 'EXCELLENT' as const },
  8: { threshold: 400, name: 'Grand Slam Club', color: '#C1A84C', paletteKey: 'OUTSTANDING' as const },
} as const;

export type TierLevel = keyof typeof TIER_CONFIG;

/**
 * Get tier level (0-8) from courses played count
 */
export function getTierLevel(coursesPlayed: number): TierLevel {
  if (coursesPlayed >= 400) return 8;
  if (coursesPlayed >= 300) return 7;
  if (coursesPlayed >= 200) return 6;
  if (coursesPlayed >= 100) return 5;
  if (coursesPlayed >= 50) return 4;
  if (coursesPlayed >= 20) return 3;
  if (coursesPlayed >= 10) return 2;
  if (coursesPlayed >= 5) return 1;
  return 0;
}

/**
 * Get tier config entry from courses played count
 */
export function getTierConfig(coursesPlayed: number): TierConfigEntry {
  const level = getTierLevel(coursesPlayed);
  return TIER_CONFIG[level];
}

/**
 * Get ring color for avatar based on courses played
 * THIS IS THE ONE FUNCTION EVERYTHING SHOULD CALL
 */
export function getRingColorForTotalPlayed(count: number): string {
  if (count >= 400) return '#C1A84C'; // Grand Slam - Chartreus gold
  if (count >= 300) return '#334E3D'; // Legendary - Emerald
  if (count >= 200) return '#4A7A4A'; // Elite - Deep green
  if (count >= 100) return '#5A8A5A'; // Century - Medium green
  if (count >= 50) return '#7A9E7A';  // Heritage - Soft forest
  if (count >= 20) return '#E5D0A1';  // Founders - Pale Lime
  if (count >= 10) return '#9AB0A3';  // Fairway - Muted sage
  if (count >= 5) return '#B8C6C9';   // Rookie - Sky Blue
  return '#B8C6C9'; // No tier - Sky Blue
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// CLBHOUZ ACHIEVEMENT PALETTE - 8-STEP PROGRESSION (for card backgrounds/gradients)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const CLBHOUZ_ACHIEVEMENT_PALETTE = {
  FAIR:        '#B8C6C9', // Sky Blue - entry level, cool/neutral
  MILD:        '#9AB0A3', // Muted sage - blend toward green
  STEADY:      '#E5D0A1', // Pale Lime - warm, encouraging
  RESPECTABLE: '#7A9E7A', // Soft forest green
  GOOD:        '#5A8A5A', // Medium golf green
  VERY_GOOD:   '#4A7A4A', // Deep green
  EXCELLENT:   '#334E3D', // Emerald - prestigious
  OUTSTANDING: '#C1A84C', // Chartreus gold - pinnacle
} as const;

export type ClbhouzAchievementKey = keyof typeof CLBHOUZ_ACHIEVEMENT_PALETTE;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// THEME COLORS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const THEME_COLORS = {
  labelText: '#64748B',  // slate-500 - for subtitles/labels
  titleText: '#1e293b',  // slate-800 - for titles
  icon: '#334E3D',       // Emerald for trophy icons
  trackBg: '#E5D0A11A',  // Pale Lime at 10% for tracks
  noTierGray: '#B8C6C9', // Sky Blue for no-tier state
} as const;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Build a complete theme object from an accent color
 */
export interface AchievementColorTheme {
  accent: string;
  bgLight: string;
  bgDark: string;
  labelText: string;
  titleText: string;
  icon: string;
}

export function buildTheme(accent: string): AchievementColorTheme {
  return {
    accent,
    bgLight: lightenColor(accent, 16),
    bgDark: darkenColor(accent, 6),
    labelText: THEME_COLORS.labelText,
    titleText: THEME_COLORS.titleText,
    icon: THEME_COLORS.icon,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE CLUB MAPPING (8 Clubs → 8 Palette Steps)
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Maps the 8 Top 100 Clubs to the 8-step palette:
 * 
 * Club       | Threshold | Palette Key   | Hex
 * -----------|-----------|---------------|----------
 * 5 Club     | 5         | FAIR          | #7A6B5B
 * 10 Club    | 10        | MILD          | #8F866F
 * 20 Club    | 20        | STEADY        | #A7A98A
 * 50 Club    | 50        | RESPECTABLE   | #C1CFA1
 * 100 Club   | 100       | GOOD          | #88B67B
 * 200 Club   | 200       | VERY_GOOD     | #5B9E55
 * 300 Club   | 300       | EXCELLENT     | #3F7F41
 * 400 Club   | 400       | OUTSTANDING   | #D2B461
 */
export const MILESTONE_PALETTE_MAP: Record<number, ClbhouzAchievementKey> = {
  5:   'FAIR',
  10:  'MILD',
  20:  'STEADY',
  50:  'RESPECTABLE',
  100: 'GOOD',
  200: 'VERY_GOOD',
  300: 'EXCELLENT',
  400: 'OUTSTANDING',
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// RATING COLOR SYSTEM (Jan 2026) - Emerald + Chartreus Gold only
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * RATING COLOR SYSTEM:
 * - Fair → Excellent: Slate-300 (#CBD5E1)
 * - Outstanding: Amber-500 (#f59e0b)
 * 
 * Legacy constants — prefer COURSE_RATING_THEMES from globalAchievementMilestoneSystem.
 */
export const RATING_COLORS = {
  SLATE: '#CBD5E1',      // Used for Fair, Good, Very Good, Excellent
  GOLD: '#f59e0b',       // Amber - Used for Outstanding only
} as const;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// EMPTY STATE THEME
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Neutral theme for users with no achievements yet
 */
export const EMPTY_HERO_THEME = buildTheme('#E5E7EB'); // slate-200 / neutral
