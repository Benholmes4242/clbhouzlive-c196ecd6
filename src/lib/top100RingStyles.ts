// src/lib/top100RingStyles.ts
// Single source of truth for ALL ring colors: profile rings, dots, map pins
// Now derives colors from the unified ACHIEVEMENT_THEMES

import type { Top100Ring } from './top100Club';
import { MILESTONE_THEMES } from './achievementThemes';

// Helper to lighten a hex color for stroke/halo
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
const TIER_TO_THRESHOLD: Record<Top100Ring, number | null> = {
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
 * Comprehensive style config for each Top 100 tier
 * Used across: profile rings, club dots/pills, map pins
 * Colors now pulled from MILESTONE_THEMES for unified styling
 */
export const TOP100_TIER_STYLES: Record<
  Top100Ring,
  {
    ringClass: string;    // Profile ring border
    dotClass: string;     // Tiny dot / pill dot
    mapFill: string;      // Map pin fill (hex)
    mapStroke: string;    // Map pin stroke/halo (hex)
  }
> = {
  none: {
    ringClass: 'ring-slate-400/70',
    dotClass: 'bg-slate-400',
    mapFill: DEFAULT_COLOR,
    mapStroke: lightenHex(DEFAULT_COLOR),
  },
  rookie: {
    ringClass: `ring-[${MILESTONE_THEMES[5].accent}]/85`,
    dotClass: `bg-[${MILESTONE_THEMES[5].accent}]`,
    mapFill: MILESTONE_THEMES[5].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[5].accent),
  },
  fairway: {
    ringClass: `ring-[${MILESTONE_THEMES[10].accent}]/85`,
    dotClass: `bg-[${MILESTONE_THEMES[10].accent}]`,
    mapFill: MILESTONE_THEMES[10].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[10].accent),
  },
  founders: {
    ringClass: `ring-[${MILESTONE_THEMES[20].accent}]/85`,
    dotClass: `bg-[${MILESTONE_THEMES[20].accent}]`,
    mapFill: MILESTONE_THEMES[20].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[20].accent),
  },
  heritage: {
    ringClass: `ring-[${MILESTONE_THEMES[50].accent}]/85`,
    dotClass: `bg-[${MILESTONE_THEMES[50].accent}]`,
    mapFill: MILESTONE_THEMES[50].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[50].accent),
  },
  century: {
    ringClass: `ring-[${MILESTONE_THEMES[100].accent}]/85`,
    dotClass: `bg-[${MILESTONE_THEMES[100].accent}]`,
    mapFill: MILESTONE_THEMES[100].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[100].accent),
  },
  elite: {
    ringClass: `ring-[${MILESTONE_THEMES[200].accent}]/90`,
    dotClass: `bg-[${MILESTONE_THEMES[200].accent}]`,
    mapFill: MILESTONE_THEMES[200].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[200].accent),
  },
  legendary: {
    ringClass: `ring-[${MILESTONE_THEMES[300].accent}]/90`,
    dotClass: `bg-[${MILESTONE_THEMES[300].accent}]`,
    mapFill: MILESTONE_THEMES[300].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[300].accent),
  },
  grandslam: {
    ringClass: `ring-[${MILESTONE_THEMES[400].accent}]/90`,
    dotClass: `bg-[${MILESTONE_THEMES[400].accent}]`,
    mapFill: MILESTONE_THEMES[400].accent,
    mapStroke: lightenHex(MILESTONE_THEMES[400].accent),
  },
};

// Backward-compatible helpers (use TOP100_TIER_STYLES directly where possible)
export function getTop100RingBorderClass(ring: Top100Ring | null | undefined): string {
  const tier = ring || 'none';
  return TOP100_TIER_STYLES[tier].ringClass;
}

export function getTop100RingDotClass(ring: Top100Ring | null | undefined): string {
  const tier = ring || 'none';
  return TOP100_TIER_STYLES[tier].dotClass;
}

/**
 * Get ring color hex value for a tier
 */
export function getRingColorForTier(tier: Top100Ring | null | undefined): string {
  if (!tier || tier === 'none') return DEFAULT_COLOR;
  const threshold = TIER_TO_THRESHOLD[tier];
  if (threshold === null) return DEFAULT_COLOR;
  return MILESTONE_THEMES[threshold]?.accent ?? DEFAULT_COLOR;
}
