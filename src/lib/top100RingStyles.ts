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
 * Get the softer pastel ring color for a tier (matching card background)
 */
function getTierRingColor(tier: Top100Ring): string {
  const threshold = TIER_TO_THRESHOLD[tier];
  if (threshold === null) return DEFAULT_COLOR;
  return MILESTONE_THEMES[threshold]?.bgDark ?? DEFAULT_COLOR;
}

/**
 * Comprehensive style config for each Top 100 tier
 * Used across: profile rings, club dots/pills, map pins
 * 
 * IMPORTANT: Ring colors use softer pastel (bgDark) to match card appearance
 * For Tailwind classes, we use inline styles where dynamic colors are needed
 */
export const TOP100_TIER_STYLES: Record<
  Top100Ring,
  {
    ringColor: string;    // Softer pastel for rings (bgDark)
    accent: string;       // Pure accent for icons
    mapFill: string;      // Map pin fill (hex)
    mapStroke: string;    // Map pin stroke/halo (hex)
  }
> = {
  none: {
    ringColor: DEFAULT_COLOR,
    accent: DEFAULT_COLOR,
    mapFill: DEFAULT_COLOR,
    mapStroke: lightenHex(DEFAULT_COLOR),
  },
  rookie: {
    ringColor: MILESTONE_THEMES[5].bgDark,
    accent: MILESTONE_THEMES[5].accent,
    mapFill: MILESTONE_THEMES[5].bgDark,
    mapStroke: lightenHex(MILESTONE_THEMES[5].bgDark),
  },
  fairway: {
    ringColor: MILESTONE_THEMES[10].bgDark,
    accent: MILESTONE_THEMES[10].accent,
    mapFill: MILESTONE_THEMES[10].bgDark,
    mapStroke: lightenHex(MILESTONE_THEMES[10].bgDark),
  },
  founders: {
    ringColor: MILESTONE_THEMES[20].bgDark,
    accent: MILESTONE_THEMES[20].accent,
    mapFill: MILESTONE_THEMES[20].bgDark,
    mapStroke: lightenHex(MILESTONE_THEMES[20].bgDark),
  },
  heritage: {
    ringColor: MILESTONE_THEMES[50].bgDark,
    accent: MILESTONE_THEMES[50].accent,
    mapFill: MILESTONE_THEMES[50].bgDark,
    mapStroke: lightenHex(MILESTONE_THEMES[50].bgDark),
  },
  century: {
    ringColor: MILESTONE_THEMES[100].bgDark,
    accent: MILESTONE_THEMES[100].accent,
    mapFill: MILESTONE_THEMES[100].bgDark,
    mapStroke: lightenHex(MILESTONE_THEMES[100].bgDark),
  },
  elite: {
    ringColor: MILESTONE_THEMES[200].bgDark,
    accent: MILESTONE_THEMES[200].accent,
    mapFill: MILESTONE_THEMES[200].bgDark,
    mapStroke: lightenHex(MILESTONE_THEMES[200].bgDark),
  },
  legendary: {
    ringColor: MILESTONE_THEMES[300].bgDark,
    accent: MILESTONE_THEMES[300].accent,
    mapFill: MILESTONE_THEMES[300].bgDark,
    mapStroke: lightenHex(MILESTONE_THEMES[300].bgDark),
  },
  grandslam: {
    ringColor: MILESTONE_THEMES[400].bgDark,
    accent: MILESTONE_THEMES[400].accent,
    mapFill: MILESTONE_THEMES[400].bgDark,
    mapStroke: lightenHex(MILESTONE_THEMES[400].bgDark),
  },
};

/**
 * Get ring border style object for inline styling
 * Uses softer pastel color to match card appearance
 */
export function getTop100RingStyle(ring: Top100Ring | null | undefined): React.CSSProperties {
  const tier = ring || 'none';
  const ringColor = TOP100_TIER_STYLES[tier].ringColor;
  return {
    border: `2px solid ${ringColor}`,
  };
}

/**
 * Get the softer pastel ring color for a ring
 */
export function getTop100RingColor(ring: Top100Ring | null | undefined): string {
  const tier = ring || 'none';
  return TOP100_TIER_STYLES[tier].ringColor;
}

/**
 * Get ring color hex value for a tier (softer pastel)
 */
export function getRingColorForTier(tier: Top100Ring | null | undefined): string {
  if (!tier || tier === 'none') return DEFAULT_COLOR;
  const threshold = TIER_TO_THRESHOLD[tier];
  if (threshold === null) return DEFAULT_COLOR;
  return MILESTONE_THEMES[threshold]?.bgDark ?? DEFAULT_COLOR;
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
