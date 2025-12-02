// src/lib/top100RingStyles.ts
// Single source of truth for ALL rating colors: profile rings, dots, map pins

import type { Top100Ring } from './top100Club';

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
    mapFill: '#94a3b8',      // neutral slate for non-club users
    mapStroke: '#cbd5e1',
  },
  rookie: {
    ringClass: 'ring-[#D9C7A3]/85',
    dotClass: 'bg-[#D9C7A3]',
    mapFill: '#D9C7A3',      // Soft Sand
    mapStroke: '#E8DCC4',
  },
  fairway: {
    ringClass: 'ring-[#8BBF5A]/85',
    dotClass: 'bg-[#8BBF5A]',
    mapFill: '#8BBF5A',      // Fairway Green
    mapStroke: '#A8D67A',
  },
  founders: {
    ringClass: 'ring-[#2E5930]/85',
    dotClass: 'bg-[#2E5930]',
    mapFill: '#2E5930',      // Deep Pine
    mapStroke: '#3F7A42',
  },
  heritage: {
    ringClass: 'ring-[#C8A44B]/85',
    dotClass: 'bg-[#C8A44B]',
    mapFill: '#C8A44B',      // Antique Gold
    mapStroke: '#D7B766',
  },
  century: {
    ringClass: 'ring-[#B7BCC6]/85',
    dotClass: 'bg-[#B7BCC6]',
    mapFill: '#B7BCC6',      // Brushed Silver
    mapStroke: '#D4D5DA',
  },
  elite: {
    ringClass: 'ring-[#D9A441]/90',
    dotClass: 'bg-[#D9A441]',
    mapFill: '#D9A441',      // Royal Gold
    mapStroke: '#E9C06E',
  },
  legendary: {
    ringClass: 'ring-[#5A3E8C]/90',
    dotClass: 'bg-[#5A3E8C]',
    mapFill: '#5A3E8C',      // Imperial Purple
    mapStroke: '#7A5BBC',
  },
  grandslam: {
    ringClass: 'ring-[#0C0F14]/90',
    dotClass: 'bg-[#0C0F14]',
    mapFill: '#0C0F14',      // Onyx Black
    mapStroke: '#2A2D33',
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
