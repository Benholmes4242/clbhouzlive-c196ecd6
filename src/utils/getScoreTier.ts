// DEPRECATED: Use ratingBands.ts instead
// This file is kept for backwards compatibility only

import { getRatingBand } from './ratingBands';

export type ScoreTier = 'outstanding' | 'excellent' | 'veryGood' | 'good' | 'fair';

export interface ScoreTierData {
  tier: ScoreTier;
  label: string;
  bg: string;
  border: string;
  text: string;
}

/**
 * @deprecated Use getRatingBand() from ratingBands.ts instead
 * This is a thin wrapper for backwards compatibility
 */
export function getScoreTier(score: number): ScoreTierData {
  const band = getRatingBand(score);
  
  // Map to old Tailwind class format (deprecated pattern)
  const bgMap: Record<string, string> = {
    outstanding: 'bg-amber-50',
    excellent: 'bg-emerald-50',
    veryGood: 'bg-blue-50',
    good: 'bg-sky-50',
    fair: 'bg-slate-50',
  };
  
  const borderMap: Record<string, string> = {
    outstanding: 'border-amber-300',
    excellent: 'border-emerald-300',
    veryGood: 'border-blue-300',
    good: 'border-sky-300',
    fair: 'border-slate-300',
  };
  
  const textMap: Record<string, string> = {
    outstanding: 'text-amber-700',
    excellent: 'text-emerald-700',
    veryGood: 'text-blue-700',
    good: 'text-sky-700',
    fair: 'text-slate-700',
  };
  
  return {
    tier: band.id as ScoreTier,
    label: band.label,
    bg: bgMap[band.id] || 'bg-slate-50',
    border: borderMap[band.id] || 'border-slate-300',
    text: textMap[band.id] || 'text-slate-700',
  };
}
