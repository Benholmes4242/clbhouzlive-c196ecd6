/**
 * SeasonLeaderboardSection Types
 * PGA broadcast meets F1 data-display visual language
 */

export type CategoryId = 'distance' | 'accuracy' | 'scrambling' | 'putting' | 'sg_total';

export interface LeaderEntry {
  rank: number;
  playerId: string;
  playerName: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  photoUrl: string | null;
  initials: string;
  statValue: number;
  statDisplayValue: string;
  statUnit: string;
}

export interface SeasonLeaderboardData {
  statId: CategoryId;
  statLabel: string;
  unitLabel: string;
  year: number;
  leaders: LeaderEntry[];
  topTenAverage: number;
}
