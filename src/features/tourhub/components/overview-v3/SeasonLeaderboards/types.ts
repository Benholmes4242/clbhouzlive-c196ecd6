// src/features/tourhub/components/overview-v3/SeasonLeaderboards/types.ts

import type { CategoryId } from './StatCategoryIcons';

export interface LeaderboardPlayer {
  rank: number;
  playerId: string;
  playerName: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  photoUrl: string | null;
  tourCode?: string;
  initials: string;
  statValue: number;
  statDisplayValue: string;
  statUnit: string;
  skillLevel: number;
  skillProgress: number;
  // Phase E — bio enrichment for StatOfTheWeek meta line
  birthDate: string | null;   // ISO date (yyyy-mm-dd) when available
  turnedPro: number | null;   // 4-digit year when available
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
