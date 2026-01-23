// Season Color Tokens for Championship Mode
// Matches the themed seasons in the championship_seasons table

export const SEASON_COLORS = {
  'Pre-Season Training': {
    primary: '#10B981',    // Emerald green
    gradient: 'from-emerald-500/10 to-emerald-600/20',
    accent: '#059669',
  },
  'Major Season': {
    primary: '#F59E0B',    // Amber gold
    gradient: 'from-amber-500/10 to-amber-600/20',
    accent: '#D97706',
  },
  'Summer Season': {
    primary: '#3B82F6',    // Sky blue
    gradient: 'from-blue-500/10 to-blue-600/20',
    accent: '#2563EB',
  },
  'Off-Season': {
    primary: '#8B5CF6',    // Purple
    gradient: 'from-purple-500/10 to-purple-600/20',
    accent: '#7C3AED',
  },
} as const;

export type SeasonName = keyof typeof SEASON_COLORS;

export function getSeasonColor(seasonName: string): typeof SEASON_COLORS[SeasonName] {
  return SEASON_COLORS[seasonName as SeasonName] || SEASON_COLORS['Pre-Season Training'];
}
