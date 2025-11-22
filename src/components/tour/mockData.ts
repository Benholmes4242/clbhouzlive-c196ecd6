/**
 * Mock data constants for Tour Central
 * Extracted to module level to prevent recreation on every render
 */

export interface Event {
  id: string;
  name: string;
  tour: 'PGA' | 'LIV' | 'DP World' | 'Amateur' | 'University';
  date: string;
  location: string;
  status: 'upcoming' | 'live';
  prize?: string;
  image?: string;
}

export interface LeaderboardEntry {
  position: number;
  player: string;
  score: string;
  today: string;
  country: string;
  change: 'up' | 'down' | 'same';
}

export interface Tournament {
  id: string;
  name: string;
  tour: string;
  status: 'live' | 'completed';
  round: string;
  leaderboard: LeaderboardEntry[];
  cutLine?: string;
}

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    name: 'The Masters Tournament',
    tour: 'PGA',
    date: '2024-04-11',
    location: 'Augusta National Golf Club, GA',
    status: 'upcoming',
    prize: '$18M',
  },
  {
    id: '2',
    name: 'LIV Golf Miami',
    tour: 'LIV',
    date: '2024-04-05',
    location: 'Trump National Doral, FL',
    status: 'live',
    prize: '$25M',
  },
  {
    id: '3',
    name: 'NCAA Division I Championship',
    tour: 'University',
    date: '2024-05-24',
    location: 'Various Locations',
    status: 'upcoming',
  },
  {
    id: '4',
    name: 'DP World Tour Championship',
    tour: 'DP World',
    date: '2024-11-14',
    location: 'Dubai, UAE',
    status: 'upcoming',
    prize: '$10M',
  },
];

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    name: 'The Players Championship',
    tour: 'PGA',
    status: 'live',
    round: 'Round 2',
    cutLine: '+2',
    leaderboard: [
      { position: 1, player: 'Scottie Scheffler', score: '-8', today: '-3', country: 'USA', change: 'up' },
      { position: 2, player: 'Jon Rahm', score: '-7', today: '-2', country: 'ESP', change: 'same' },
      { position: 3, player: 'Rory McIlroy', score: '-6', today: '-1', country: 'NIR', change: 'down' },
      { position: 4, player: 'Viktor Hovland', score: '-5', today: '-2', country: 'NOR', change: 'up' },
      { position: 5, player: 'Xander Schauffele', score: '-4', today: 'E', country: 'USA', change: 'same' },
    ],
  },
  {
    id: '2',
    name: 'LIV Golf Singapore',
    tour: 'LIV',
    status: 'live',
    round: 'Round 1',
    leaderboard: [
      { position: 1, player: 'Bryson DeChambeau', score: '-5', today: '-5', country: 'USA', change: 'up' },
      { position: 2, player: 'Cameron Smith', score: '-4', today: '-4', country: 'AUS', change: 'up' },
      { position: 3, player: 'Brooks Koepka', score: '-3', today: '-3', country: 'USA', change: 'same' },
    ],
  },
];
