// src/features/tourhub/components/overview-v3/SeasonLeaderboards/types.ts

export type CategoryId = 'distance' | 'accuracy' | 'scrambling' | 'putting' | 'sg_total';

export interface LeaderboardPlayer {
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
  skillLevel: number;
  skillProgress: number;
}

export interface LeaderboardCategory {
  id: CategoryId;
  name: string;
  icon: string;
  description: string;
  players: LeaderboardPlayer[];
  topTenAverage: number;
}

export interface SeasonLeaderboardsData {
  year: number;
  tourName: string;
  categories: LeaderboardCategory[];
}
