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
}

export interface DangerousProfile {
  id: string;
  name: string;
  avatarUrl: string;
  worldRankText?: string;
  traitLabel: string;
  oneLiner: string;
}

export type ImportanceTier = 'critical' | 'significant' | 'useful';
export type ConfidenceTier = 'elite' | 'high' | 'medium';
