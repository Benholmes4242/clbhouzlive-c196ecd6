// Season Color Tokens for Championship Mode
// Matches the themed seasons in the championship_seasons table
// Updated to use subtle, cohesive palette

export const SEASON_COLORS = {
  'Pre-Season Training': {
    primary: '#2DD4BF',    // teal-400 (subtle, no bright green)
    secondary: '#99F6E4',  // teal-200
    background: '#F0FDFA', // teal-50
    gradient: 'from-teal-400/10 to-teal-500/20',
    accent: '#14B8A6',     // teal-500
  },
  'Major Season': {
    primary: '#F59E0B',    // amber-500 (warm gold)
    secondary: '#FCD34D',  // amber-300
    background: '#FFFBEB', // amber-50
    gradient: 'from-amber-500/10 to-amber-600/20',
    accent: '#D97706',     // amber-600
  },
  'Summer Season': {
    primary: '#FDBA74',    // orange-300 (soft peach)
    secondary: '#FED7AA',  // orange-200
    background: '#FFF7ED', // orange-50
    gradient: 'from-orange-300/10 to-orange-400/20',
    accent: '#FB923C',     // orange-400
  },
  'Off-Season': {
    primary: '#94A3B8',    // slate-400 (cool slate)
    secondary: '#CBD5E1',  // slate-300
    background: '#F8FAFC', // slate-50
    gradient: 'from-slate-400/10 to-slate-500/20',
    accent: '#64748B',     // slate-500
  },
} as const;

export type SeasonName = keyof typeof SEASON_COLORS;

export function getSeasonColor(seasonName: string): typeof SEASON_COLORS[SeasonName] {
  return SEASON_COLORS[seasonName as SeasonName] || SEASON_COLORS['Pre-Season Training'];
}
