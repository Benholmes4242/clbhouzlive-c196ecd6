// src/lib/top100RingStyles.ts
// Single source of truth for ALL rating colors: profile rings, dots, map pins
// Now derives colors from the unified CLUB_STEPS in top100Club.ts

import type { Top100Ring } from './top100Club';
import { TIER_BY_ID } from './top100Club';

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

/**
 * Comprehensive style config for each Top 100 tier
 * Used across: profile rings, club dots/pills, map pins
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
    ringClass: `ring-[${TIER_BY_ID.rookie?.ringColor}]/85`,
    dotClass: `bg-[${TIER_BY_ID.rookie?.ringColor}]`,
    mapFill: TIER_BY_ID.rookie?.ringColor ?? DEFAULT_COLOR,
    mapStroke: lightenHex(TIER_BY_ID.rookie?.ringColor ?? DEFAULT_COLOR),
  },
  fairway: {
    ringClass: `ring-[${TIER_BY_ID.fairway?.ringColor}]/85`,
    dotClass: `bg-[${TIER_BY_ID.fairway?.ringColor}]`,
    mapFill: TIER_BY_ID.fairway?.ringColor ?? DEFAULT_COLOR,
    mapStroke: lightenHex(TIER_BY_ID.fairway?.ringColor ?? DEFAULT_COLOR),
  },
  founders: {
    ringClass: `ring-[${TIER_BY_ID.founders?.ringColor}]/85`,
    dotClass: `bg-[${TIER_BY_ID.founders?.ringColor}]`,
    mapFill: TIER_BY_ID.founders?.ringColor ?? DEFAULT_COLOR,
    mapStroke: lightenHex(TIER_BY_ID.founders?.ringColor ?? DEFAULT_COLOR),
  },
  heritage: {
    ringClass: `ring-[${TIER_BY_ID.heritage?.ringColor}]/85`,
    dotClass: `bg-[${TIER_BY_ID.heritage?.ringColor}]`,
    mapFill: TIER_BY_ID.heritage?.ringColor ?? DEFAULT_COLOR,
    mapStroke: lightenHex(TIER_BY_ID.heritage?.ringColor ?? DEFAULT_COLOR),
  },
  century: {
    ringClass: `ring-[${TIER_BY_ID.century?.ringColor}]/85`,
    dotClass: `bg-[${TIER_BY_ID.century?.ringColor}]`,
    mapFill: TIER_BY_ID.century?.ringColor ?? DEFAULT_COLOR,
    mapStroke: lightenHex(TIER_BY_ID.century?.ringColor ?? DEFAULT_COLOR),
  },
  elite: {
    ringClass: `ring-[${TIER_BY_ID.elite?.ringColor}]/90`,
    dotClass: `bg-[${TIER_BY_ID.elite?.ringColor}]`,
    mapFill: TIER_BY_ID.elite?.ringColor ?? DEFAULT_COLOR,
    mapStroke: lightenHex(TIER_BY_ID.elite?.ringColor ?? DEFAULT_COLOR),
  },
  legendary: {
    ringClass: `ring-[${TIER_BY_ID.legendary?.ringColor}]/90`,
    dotClass: `bg-[${TIER_BY_ID.legendary?.ringColor}]`,
    mapFill: TIER_BY_ID.legendary?.ringColor ?? DEFAULT_COLOR,
    mapStroke: lightenHex(TIER_BY_ID.legendary?.ringColor ?? DEFAULT_COLOR),
  },
  grandslam: {
    ringClass: `ring-[${TIER_BY_ID.grandslam?.ringColor}]/90`,
    dotClass: `bg-[${TIER_BY_ID.grandslam?.ringColor}]`,
    mapFill: TIER_BY_ID.grandslam?.ringColor ?? DEFAULT_COLOR,
    mapStroke: lightenHex(TIER_BY_ID.grandslam?.ringColor ?? DEFAULT_COLOR),
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
