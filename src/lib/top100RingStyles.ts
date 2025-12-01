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
  bronze: {
    ringClass: 'ring-amber-600/80',
    dotClass: 'bg-amber-500',
    mapFill: '#d97706',      // warm amber/bronze
    mapStroke: '#fbbf24',
  },
  blue: {
    // Muted steel blue (NOT bright sky-500)
    ringClass: 'ring-[#4682B4]/85',
    dotClass: 'bg-[#5F9EA0]',
    mapFill: '#4682B4',      // steel blue
    mapStroke: '#87CEEB',
  },
  green: {
    ringClass: 'ring-emerald-500/85',
    dotClass: 'bg-emerald-400',
    mapFill: '#10b981',      // emerald
    mapStroke: '#6ee7b7',
  },
  silver: {
    ringClass: 'ring-slate-200/85',
    dotClass: 'bg-slate-200',
    mapFill: '#94a3b8',      // slate
    mapStroke: '#e2e8f0',
  },
  gold: {
    ringClass: 'ring-yellow-400/90',
    dotClass: 'bg-yellow-400',
    mapFill: '#eab308',      // yellow/gold
    mapStroke: '#fef08a',
  },
  platinum: {
    ringClass: 'ring-fuchsia-300/90',
    dotClass: 'bg-fuchsia-300',
    mapFill: '#c026d3',      // fuchsia/purple
    mapStroke: '#f0abfc',
  },
  obsidian: {
    ringClass: 'ring-slate-900/90',
    dotClass: 'bg-slate-900',
    mapFill: '#0f172a',      // very dark slate/obsidian
    mapStroke: '#475569',
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
