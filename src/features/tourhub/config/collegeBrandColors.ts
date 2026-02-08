/**
 * Hardcoded brand colors for top college golf programs.
 * Used for the immersive hero gradient background.
 */

interface CollegeGradient {
  from: string;
  to: string;
}

const COLLEGE_BRAND_COLORS: Record<string, CollegeGradient> = {
  georgia:          { from: '#BA0C2F', to: '#1A1A2E' },
  texas:            { from: '#BF5700', to: '#1E1E30' },
  'arizona state':  { from: '#8C1D40', to: '#1A1A2E' },
  'oklahoma state': { from: '#FF6600', to: '#1A1A2E' },
  usc:              { from: '#990000', to: '#1E1E30' },
  florida:          { from: '#0021A5', to: '#1A1A2E' },
  alabama:          { from: '#9E1B32', to: '#1A1A2E' },
  lsu:              { from: '#461D7C', to: '#1A1A2E' },
  'wake forest':    { from: '#9E7E38', to: '#1A1A2E' },
  stanford:         { from: '#8C1515', to: '#1A1A2E' },
  'north carolina': { from: '#4B9CD3', to: '#1A1A2E' },
  'oklahoma':       { from: '#841617', to: '#1A1A2E' },
};

const DEFAULT_GRADIENT: CollegeGradient = { from: '#1A1A2E', to: '#2D2D44' };

export function getCollegeGradient(normalizedName: string): CollegeGradient {
  return COLLEGE_BRAND_COLORS[normalizedName] || DEFAULT_GRADIENT;
}

export function getCollegeGradientCSS(normalizedName: string): string {
  const { from, to } = getCollegeGradient(normalizedName);
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}
