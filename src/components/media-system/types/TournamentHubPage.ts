import type { LiveLeaderboardEntry, TournamentLiveMeta } from './media';

export type TournamentHubPageState = 'live' | 'result' | 'upcoming';

export interface TournamentHubPage {
  // Identity
  tournamentId: string;
  tournamentName: string;
  tourSlug: string;
  tourName: string;
  tourPriority: number;
  purse: number | null;
  state: TournamentHubPageState;

  // Venue
  venueName: string | null;
  venueCity: string | null;
  venuePar: number | null;
  venueYardage: number | null;

  // Live / Result fields
  currentRound: number;
  totalRounds: number;
  leader: LiveLeaderboardEntry | null;
  leaderboard: LiveLeaderboardEntry[];
  volatilityIndex: number;
  momentumTags: string[];
  leaderStats: TournamentLiveMeta['leaderStats'];
  insight: string | null;

  // Upcoming fields
  startDate: string | null;
  endDate: string | null;

  // Post IDs for likes/comments
  postId: string;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
}
