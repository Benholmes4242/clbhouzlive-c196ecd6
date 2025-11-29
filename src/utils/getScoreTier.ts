export type ScoreTier = 'outstanding' | 'excellent' | 'veryGood' | 'good' | 'fair';

export interface ScoreTierData {
  tier: ScoreTier;
  label: string;
  bg: string;
  border: string;
  text: string;
  barFill: string; // Color for distribution/progress bars
}

/**
 * Get the score tier data for a given rating score.
 * Returns consistent badge styling tokens used across Community Score and Review Cards.
 */
export function getScoreTier(score: number): ScoreTierData {
  if (score >= 9.5) {
    return {
      tier: 'outstanding',
      label: 'Outstanding',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-700',
      barFill: 'bg-amber-50',
    };
  }
  
  if (score >= 8.5) {
    return {
      tier: 'excellent',
      label: 'Excellent',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-700',
      barFill: 'bg-emerald-50',
    };
  }
  
  if (score >= 7.5) {
    return {
      tier: 'veryGood',
      label: 'Very Good',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-700',
      barFill: 'bg-blue-50',
    };
  }
  
  if (score >= 6.5) {
    return {
      tier: 'good',
      label: 'Good',
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      text: 'text-sky-700',
      barFill: 'bg-sky-50',
    };
  }
  
  return {
    tier: 'fair',
    label: 'Fair',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-700',
    barFill: 'bg-slate-50',
  };
}
