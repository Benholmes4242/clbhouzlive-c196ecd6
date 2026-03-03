/**
 * Tournament Insights 2.0 - Type Definitions
 */

export interface TournamentInsightsData {
  tournament: {
    id: string;
    name: string;
    courseName: string;
    location?: string;
    dateRangeText: string;
    purseText?: string;
    parText?: string;
    yardageText?: string;
    heroImageUrl: string;
  };

  courseDNA: CourseDNAItem[];

  clubhouseIntelligence: {
    primaryText: string;
    expandedText?: string;
  };

  winners: WinnerProfile[];

  dangerous: DangerousProfile[];

  // Combined contenders + threats for unified carousel
  contenderCards: ContenderCard[];
}

export interface CourseDNAItem {
  id: string;
  label: string;
  icon: string;
  tier: ImportanceTier;
  note?: string;
}

export interface WinnerProfile {
  id: string;
  name: string;
  countryCode?: string;
  avatarUrl: string;
  confidenceTier: ConfidenceTier;
  fitBullets: string[];
  keyTag?: string;
  promoted?: boolean;
}

export interface DangerousProfile {
  id: string;
  name: string;
  avatarUrl: string;
  worldRankText?: string;
  traitLabel: string;
  oneLiner: string;
}

// Combined card type for unified carousel
export interface ContenderCard {
  id: string;
  name: string;
  countryCode?: string;
  avatarUrl: string;
  description: string;
  type: 'contender' | 'threat';
  rank?: number;
  traitLabel?: string;
  confidenceTier?: ConfidenceTier;
  fitBullets?: string[];
  promoted?: boolean;
}

export type ImportanceTier = 'critical' | 'significant' | 'useful';
export type ConfidenceTier = 'elite' | 'high' | 'medium';

// =============================================
// Live Prediction Tracking Types
// =============================================

export type TournamentPhase = 'pre-tournament' | 'in-progress' | 'completed';
export type IntelligenceView = 'live' | 'upcoming';

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
  performanceStatus: 'outperforming' | 'matching' | 'underperforming' | 'cut' | 'withdrawn' | 'not-started';
  country: string | null;
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
  allPicks: TrackedPrediction[];  // Top 5 + dark horses in one list
  accuracy: AccuracyMetrics;
  lastUpdated: string;
}

export interface NextTournamentPreview {
  id: string;
  name: string;
  courseName: string;
  startDate: string;
  hasPredictions: boolean;
}
