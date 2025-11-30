// src/lib/top100RingStyles.ts
// Single source of truth for Top 100 ring and dot colors

import type { Top100Ring } from './top100Club';

export function getTop100RingBorderClass(ring: Top100Ring | null | undefined): string {
  switch (ring) {
    case 'bronze':
      return 'ring-amber-600/80';
    case 'blue':
      return 'ring-sky-500/85';
    case 'green':
      return 'ring-emerald-500/85';
    case 'silver':
      return 'ring-slate-200/85';
    case 'gold':
      return 'ring-yellow-400/90';
    case 'platinum':
      return 'ring-fuchsia-300/90';
    case 'obsidian':
      return 'ring-slate-900/90';
    case 'none':
    default:
      return 'ring-slate-700/60';
  }
}

export function getTop100RingDotClass(ring: Top100Ring | null | undefined): string {
  switch (ring) {
    case 'bronze':
      return 'bg-amber-500';
    case 'blue':
      return 'bg-sky-400';
    case 'green':
      return 'bg-emerald-400';
    case 'silver':
      return 'bg-slate-200';
    case 'gold':
      return 'bg-yellow-400';
    case 'platinum':
      return 'bg-fuchsia-300';
    case 'obsidian':
      return 'bg-slate-900';
    case 'none':
    default:
      return 'bg-slate-500';
  }
}
