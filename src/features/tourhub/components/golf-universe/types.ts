/**
 * Golf Universe - Type Definitions
 * The world's most advanced single-page overview of professional golf
 */

export type TourLens = 
  | 'global'
  | 'pga' 
  | 'lpga' 
  | 'liv' 
  | 'dpworld' 
  | 'majors' 
  | 'team';

export interface GolfEvent {
  id: string;
  name: string;
  tour: string;
  status: 'live' | 'upcoming' | 'complete' | 'scheduled' | 'inprogress' | 'closed';
  startDate: string;
  endDate: string;
  venueName: string | null;
  venueCity: string | null;
  venueCountry: string | null;
  courseName: string | null;
  purse: number | null;
  currency: string | null;
  defendingChampion: string | null;
  importanceScore: number;
  isLive: boolean;
  isMajor: boolean;
  imageUrl?: string;
}

export interface RankedPlayer {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  worldRank: number | null;
  previousRank: number | null;
  rankChange: number;
  momentum: 'rising' | 'stable' | 'falling';
  earnings: number | null;
  eventsPlayed: number | null;
  wins: number | null;
  top10s: number | null;
  scoringAvg: number | null;
  fedexRank: number | null;
  recentFinishes: number[];
}

export interface Storyline {
  id: string;
  title: string;
  summary: string;
  type: 'breaking' | 'trending' | 'insight' | 'recap';
  tour: string;
  playerIds?: string[];
  eventId?: string;
  imageUrl?: string;
  timestamp: string;
  importance: number;
}

export interface Venue {
  id: string;
  name: string;
  courseName: string | null;
  city: string | null;
  country: string | null;
  par: number | null;
  yardage: number | null;
  signatureHoles: number[];
  famousMoments: string[];
  winnersHistory: { year: number; name: string }[];
  imageUrl?: string;
}

export interface GlobalPulseItem {
  id: string;
  type: 'live' | 'tee-time' | 'breaking' | 'result';
  headline: string;
  subtext?: string;
  tour: string;
  eventId?: string;
  timestamp: string;
  priority: number;
}

export interface LeaderboardEntry {
  position: number;
  playerId: string;
  playerName: string;
  country: string | null;
  photoUrl: string | null;
  score: number;
  scoreDisplay: string;
  thru: string;
  today: number;
  todayDisplay: string;
  movement: 'up' | 'down' | 'same';
}

export interface UserFollows {
  players: string[];
  tours: TourLens[];
  events: string[];
}

export interface DataUnlock {
  key: string;
  label: string;
  locked: boolean;
  comingSoon?: boolean;
}
