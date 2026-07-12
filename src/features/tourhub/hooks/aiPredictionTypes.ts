/**
 * aiPredictionTypes — types shared by useAIPredictions and
 * usePredictionTracker. Rescued from
 * `components/tournament-insights/types.ts` ahead of the O5 nuke so
 * the hooks survive after that folder is deleted.
 */

export type TournamentPhase = 'pre-tournament' | 'in-progress' | 'completed';

export interface NextTournamentPreview {
  id: string;
  name: string;
  courseName: string;
  startDate: string;
  hasPredictions: boolean;
}

export interface TrackedPrediction {
  playerName: string;
  playerId: string;
  pgaTourId: string;
  predictedRank: number;
  winProbability: number;
  reasons: string[];
  isDarkHorse: boolean;
  actualPosition: number | null;
  actualPositionTied: boolean;
  score: number | null;
  thru: number | null;
  status: string | null;
  currentRound: number | null;
  positionDelta: number | null;
  performanceStatus:
    | 'outperforming'
    | 'matching'
    | 'underperforming'
    | 'cut'
    | 'withdrawn'
    | 'not-started';
  /** Direction relative to previous poll. 'flat' on first poll or no change. */
  moveDir: 'up' | 'down' | 'flat';
  /** Absolute integer of position delta vs previous poll. 0 when flat. */
  moveSpots: number;
  country: string | null;
  /**
   * Phase C — Editorial layer: per-pick pulled-quote forwarded from
   * `AITopContender.pulledQuote`. Component falls back to `reasons[0]`.
   */
  pulledQuote?: string | null;
}

export interface AccuracyMetrics {
  totalPredictions: number;
  inTop5: number;
  inTop10: number;
  inTop20: number;
  accuracyLabel: string;
  overallGrade: 'excellent' | 'good' | 'mixed' | 'poor';
}

export interface PredictionTrackerData {
  predictions: TrackedPrediction[];
  darkHorses: TrackedPrediction[];
  /** Top 5 + dark horses in one list. */
  allPicks: TrackedPrediction[];
  accuracy: AccuracyMetrics;
  lastUpdated: string;
  /** Actual position-1 score from full leaderboard. */
  tournamentLeaderScore: number | null;
}
