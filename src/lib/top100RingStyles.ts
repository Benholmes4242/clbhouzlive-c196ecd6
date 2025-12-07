/**
 * Top 100 Ring Styles - Part of Global Achievement & Milestone System
 * 
 * All ring colors derived from MILESTONE_THEMES.accent at 100% opacity.
 * NO opacity modifiers (/85, /90, etc.) - pure solid accent colors only.
 * 
 * Used for: profile avatar rings, club dots/pills, map pins.
 */

import type { Top100Ring } from './top100Club';
import { MILESTONE_THEMES, type MilestoneTier } from './globalAchievementMilestoneSystem';

// Helper to lighten a hex color for stroke/halo effects
function lightenHex(hex: string, percent = 20): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 255) + Math.round(255 * (percent / 100)));
  const g = Math.min(255, ((num >> 8) & 255) + Math.round(255 * (percent / 100)));
  const b = Math.min(255, (num & 255) + Math.round(255 * (percent / 100)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Default color for 'none' tier
const DEFAULT_COLOR = '#94a3b8';

// Map tier ID to threshold for theme lookup
const TIER_TO_THRESHOLD: Record<Top100Ring, MilestoneTier | null> = {
  none: null,
  rookie: 5,
  fairway: 10,
  founders: 20,
  heritage: 50,
  century: 100,
  elite: 200,
  legendary: 300,
  grandslam: 400,
};

/**
 * Get the pure accent color for a tier (no opacity modifiers)
 */
function getTierAccent(tier: Top100Ring): string {
  const threshold = TIER_TO_THRESHOLD[tier];
  if (threshold === null) return DEFAULT_COLOR;
  return MILESTONE_THEMES[threshold]?.accent ?? DEFAULT_COLOR;
}

/**
 * Comprehensive style config for each Top 100 tier
 * Used across: profile rings, club dots/pills, map pins
 * 
 * IMPORTANT: All colors are pure accent at 100% opacity
 * For Tailwind classes, we use inline styles where dynamic colors are needed
 */
export const TOP100_TIER_STYLES: Record<
  Top100Ring,
  {
    accent: string;       // Pure accent color
    mapFill: string;      // Map pin fill (hex)
    mapStroke: string;    // Map pin stroke/halo (hex)
  }
> = {
  none: {
    accent: DEFAULT_COLOR,
    mapFill: DEFAULT_COLOR,
    mapStroke: lightenHex(DEFAULT_COLOR),
  },
  rookie: {
    accent: MILESTONE_THEMES[5].accent,
    mapFill: MILESTONE_THEMES[5].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[5].accent),
  },
  fairway: {
    accent: MILESTONE_THEMES[10].accent,
    mapFill: MILESTONE_THEMES[10].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[10].accent),
  },
  founders: {
    accent: MILESTONE_THEMES[20].accent,
    mapFill: MILESTONE_THEMES[20].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[20].accent),
  },
  heritage: {
    accent: MILESTONE_THEMES[50].accent,
    mapFill: MILESTONE_THEMES[50].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[50].accent),
  },
  century: {
    accent: MILESTONE_THEMES[100].accent,
    mapFill: MILESTONE_THEMES[100].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[100].accent),
  },
  elite: {
    accent: MILESTONE_THEMES[200].accent,
    mapFill: MILESTONE_THEMES[200].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[200].accent),
  },
  legendary: {
    accent: MILESTONE_THEMES[300].accent,
    mapFill: MILESTONE_THEMES[300].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[300].accent),
  },
  grandslam: {
    accent: MILESTONE_THEMES[400].accent,
    mapFill: MILESTONE_THEMES[400].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[400].accent),
  },
};

/**
 * Get ring border style object for inline styling
 * Use this instead of Tailwind classes for dynamic ring colors
 */
export function getTop100RingStyle(ring: Top100Ring | null | undefined): React.CSSProperties {
  const tier = ring || 'none';
  const accent = TOP100_TIER_STYLES[tier].accent;
  return {
    border: `2px solid ${accent}`,
  };
}

/**
 * Get the pure accent color for a ring
 */
export function getTop100RingAccent(ring: Top100Ring | null | undefined): string {
  const tier = ring || 'none';
  return TOP100_TIER_STYLES[tier].accent;
}

/**
 * Get ring color hex value for a tier (backwards compatible)
 */
export function getRingColorForTier(tier: Top100Ring | null | undefined): string {
  if (!tier || tier === 'none') return DEFAULT_COLOR;
  const threshold = TIER_TO_THRESHOLD[tier];
  if (threshold === null) return DEFAULT_COLOR;
  return MILESTONE_THEMES[threshold]?.accent ?? DEFAULT_COLOR;
}

// Deprecated: Use inline styles with getTop100RingStyle() instead
export function getTop100RingBorderClass(ring: Top100Ring | null | undefined): string {
  console.warn('getTop100RingBorderClass is deprecated. Use getTop100RingStyle() for inline styles instead.');
  return '';
}

// Deprecated: Use inline styles instead
export function getTop100RingDotClass(ring: Top100Ring | null | undefined): string {
  console.warn('getTop100RingDotClass is deprecated. Use inline styles with TOP100_TIER_STYLES[tier].accent instead.');
  return '';
}
