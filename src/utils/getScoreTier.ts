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
      bg: 'bg-[#FFF3E4]',       // soft bronze tint
      border: 'border-[#D8A265]',
      text: 'text-[#7A4C1F]',
      barFill: 'bg-[#D8A265]',  // Sunset Bronze
    };
  }
  
  if (score >= 8.5) {
    return {
      tier: 'excellent',
      label: 'Excellent',
      bg: 'bg-[#E5ECF3]',       // soft slate-blue tint
      border: 'border-[#37546B]',
      text: 'text-[#243345]',
      barFill: 'bg-[#37546B]',  // Slate Blue-Grey
    };
  }
  
  if (score >= 7.5) {
    return {
      tier: 'veryGood',
      label: 'Very Good',
      bg: 'bg-[#E6F1EC]',       // soft pine-green tint
      border: 'border-[#2F604A]',
      text: 'text-[#1E3D2F]',
      barFill: 'bg-[#2F604A]',  // Pine Green
    };
  }
  
  if (score >= 6.5) {
    return {
      tier: 'good',
      label: 'Good',
      bg: 'bg-[#EAF6F0]',       // soft sea-mist tint
      border: 'border-[#8FBCA8]',
      text: 'text-[#305948]',
      barFill: 'bg-[#8FBCA8]',  // Sea Mist Green
    };
  }
  
  return {
    tier: 'fair',
    label: 'Fair',
    bg: 'bg-[#F4ECE0]',         // soft sand-dune tint
    border: 'border-[#D2C6B2]',
    text: 'text-[#6E5A43]',
    barFill: 'bg-[#D2C6B2]',    // Sand Dune
  };
}
