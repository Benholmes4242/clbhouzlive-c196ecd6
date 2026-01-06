/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                     CLBHOUZ ACHIEVEMENT & RATING PALETTE                                 ║
 * ║                          Single Source of Truth                                          ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                          ║
 * ║  This file defines the 8-step progression palette used across:                           ║
 * ║    • Milestone Clubs (5 → 400)                                                           ║
 * ║    • Course Ratings (Fair → Outstanding)                                                  ║
 * ║                                                                                          ║
 * ║  NO hard-coded hexes for milestones or rating bars anywhere else.                        ║
 * ║  Everything must come through this file + the mappings in globalAchievementMilestoneSystem║
 * ║                                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// CLBHOUZ ACHIEVEMENT PALETTE - 8-STEP PROGRESSION
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const CLBHOUZ_ACHIEVEMENT_PALETTE = {
  FAIR:        '#7A6B5B', // Rich earthy brown - lowest tier
  MILD:        '#8F866F', // Softer earthy neutral
  STEADY:      '#A7A98A', // Khaki "steady" tone
  RESPECTABLE: '#C1CFA1', // Pale green
  GOOD:        '#88B67B', // Fairway green
  VERY_GOOD:   '#5B9E55', // Strong green
  EXCELLENT:   '#3F7F41', // Deep championship green
  OUTSTANDING: '#D2B461', // Warm trophy gold - highest tier
} as const;

export type ClbhouzAchievementKey = keyof typeof CLBHOUZ_ACHIEVEMENT_PALETTE;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// THEME COLORS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const THEME_COLORS = {
  labelText: '#4B5563',  // slate-600 - for subtitles/labels
  titleText: '#111827',  // slate-900 - for titles
  icon: '#111827',       // ALL trophies/icons use dark slate, not accent
  trackBg: '#E2E7EC',    // neutral grey for rating bar tracks
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
// RATING COLOR SYSTEM (Jan 2026) - Slate + Gold only
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * NEW RATING COLOR SYSTEM:
 * - Fair → Excellent: All use SLATE (#64748B)
 * - Outstanding: Uses GOLD (#D2B461)
 * 
 * The old green progression (RESPECTABLE, GOOD, VERY_GOOD, EXCELLENT) 
 * is NO LONGER used for rating bars/pills.
 */
export const RATING_COLORS = {
  SLATE: '#64748B',      // Used for Fair, Good, Very Good, Excellent
  GOLD: '#D2B461',       // Used for Outstanding only
} as const;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// EMPTY STATE THEME
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Neutral theme for users with no achievements yet
 */
export const EMPTY_HERO_THEME = buildTheme('#E5E7EB'); // slate-200 / neutral
