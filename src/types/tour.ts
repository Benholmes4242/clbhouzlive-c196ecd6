// Pro & College shared
export type TourType = 'PGA' | 'LIV' | 'DP_WORLD' | 'LPGA' | 'ASIAN' | 'NCAA_MEN' | 'NCAA_WOMEN';

export interface Event {
  id: string;
  name: string;
  tour: TourType;
  startDate: string;   // ISO
  endDate: string;     // ISO
  courseName: string;
  courseLocation: string;
  prizePool?: number;  // in USD
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  heroImageUrl?: string;
  logoUrl?: string;
  strengthOfField?: number; // 1–100
  isMajor?: boolean;
}

export interface LeaderboardEntry {
  position: number;
  playerName: string;
  countryCode: string;
  scoreToPar: number;
  todayScore: number;
  thru?: number;
}

export interface Leaderboard {
  eventId: string;
  round: number;
  cutLine?: string;
  entries: LeaderboardEntry[];
}

export interface PlayerRanking {
  id: string;
  playerName: string;
  countryCode: string;
  tour: TourType;
  rank: number;
  points: number;
  movement: number; // +2, -1 etc
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  tour?: TourType;
  publishedAt: string;
  imageUrl?: string;
  url?: string; // external if needed later
  summary: string;
  tag?: string; // 'Equipment', 'Feature', etc
}

// College-specific
export interface CollegeTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  conference: string;
  ranking: number;
  lastResult?: string; // "T3 at East Lake Invitational"
  primaryColour?: string;
}

export interface CollegePlayer {
  id: string;
  name: string;
  universityId: string;
  universityName: string;
  countryCode: string;
  year: 'FR' | 'SO' | 'JR' | 'SR';
  scoringAverage: number;
  ranking: number;
  formRating: number; // 1–100
}

export interface CollegeEvent extends Event {
  division: 'DIV_I' | 'DIV_II' | 'DIV_III';
}
