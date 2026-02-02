/**
 * useTournamentInsights - Transforms AI predictions into the 2.0 narrative shape
 */

import { useMemo } from 'react';
import { useAIPredictions } from '../../../hooks/useAIPredictions';
import { format, parseISO } from 'date-fns';
import { getFallbackCourseImage } from '../../../hooks/useVenueImage';
import type { 
  TournamentInsightsData, 
  CourseDNAItem, 
  ConfidenceTier, 
  ImportanceTier 
} from '../types';

export function useTournamentInsights() {
  const { data: aiData, isLoading, error } = useAIPredictions();

  const data = useMemo((): TournamentInsightsData | null => {
    if (!aiData) return null;

    const { tournament, topContenders, darkHorses, courseAnalysis } = aiData;

    // Format date range
    const formatDate = (dateStr: string) => {
      try {
        return format(parseISO(dateStr), 'MMM d');
      } catch {
        return dateStr;
      }
    };
    const dateRangeText = `${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`;

    // Format purse
    const purseText = tournament.purse 
      ? `$${(tournament.purse / 1000000).toFixed(1)}M` 
      : undefined;

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        courseName: tournament.venueName,
        location: tournament.venueCity 
          ? `${tournament.venueCity}, ${tournament.venueState}` 
          : tournament.venueState,
        dateRangeText,
        purseText,
        parText: tournament.par ? `Par ${tournament.par}` : undefined,
        yardageText: tournament.yardage 
          ? `${tournament.yardage.toLocaleString()} yds` 
          : undefined,
        heroImageUrl: getFallbackCourseImage(tournament.name),
      },

      courseDNA: transformCourseDNA(courseAnalysis?.keyStats || []),

      aiEdge: {
        headline: 'The Edge',
        summaryLines: extractSummaryLines(courseAnalysis?.insight),
        expanded: {
          bullets: courseAnalysis?.keyStats || [],
          supportingStats: [],
        },
      },

      winners: topContenders.slice(0, 5).map((p, i) => ({
        id: p.playerId,
        name: p.playerName,
        countryCode: p.country,
        avatarUrl: p.photoUrl || '',
        confidenceTier: getConfidenceTier(i),
        fitBullets: p.reasons?.slice(0, 3) || [],
        keyTag: extractKeyTag(p.reasons?.[0]),
      })),

      dangerous: darkHorses.slice(0, 4).map(dh => ({
        id: dh.playerId,
        name: dh.playerName,
        avatarUrl: dh.photoUrl || '',
        worldRankText: dh.worldRanking ? `#${dh.worldRanking}` : undefined,
        traitLabel: extractTraitLabel(dh.keyStat),
        oneLiner: dh.hook,
      })),
    };
  }, [aiData]);

  return { data, isLoading, error };
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function getConfidenceTier(rank: number): ConfidenceTier {
  if (rank === 0) return 'elite';
  if (rank <= 2) return 'high';
  return 'medium';
}

function extractTraitLabel(keyStat: string | undefined): string {
  if (!keyStat) return 'DARK HORSE';
  
  // Convert "Top 5 in scrambling" → "ELITE SCRAMBLING"
  const statMatch = keyStat.match(/in\s+(.+)$/i);
  if (statMatch) return `ELITE ${statMatch[1].toUpperCase()}`;
  
  // Convert "Great putter" → "GREAT PUTTER"
  return keyStat.toUpperCase().slice(0, 20);
}

function extractKeyTag(reason: string | undefined): string | undefined {
  if (!reason) return undefined;
  
  // Extract first 2-3 words as a tag
  const words = reason.split(' ').slice(0, 3);
  if (words.length < 2) return reason;
  
  return words.join(' ');
}

function extractSummaryLines(insight: string | undefined): string[] {
  if (!insight) return ['Analysis powered by Clubhouse Intelligence'];
  
  // Split insight into 2-3 sentences max
  const sentences = insight.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.slice(0, 3).map(s => s.trim() + '.');
}

function transformCourseDNA(keyStats: string[]): CourseDNAItem[] {
  const skillConfig: Record<string, { icon: string; defaultTier: ImportanceTier }> = {
    accuracy: { icon: 'accuracy', defaultTier: 'critical' },
    'driving accuracy': { icon: 'accuracy', defaultTier: 'critical' },
    scrambling: { icon: 'scrambling', defaultTier: 'significant' },
    putting: { icon: 'putting', defaultTier: 'significant' },
    'strokes gained putting': { icon: 'putting', defaultTier: 'significant' },
    distance: { icon: 'distance', defaultTier: 'useful' },
    'driving distance': { icon: 'distance', defaultTier: 'useful' },
    'ball striking': { icon: 'accuracy', defaultTier: 'critical' },
    'greens in regulation': { icon: 'accuracy', defaultTier: 'critical' },
    'approach': { icon: 'accuracy', defaultTier: 'significant' },
    'around the green': { icon: 'scrambling', defaultTier: 'significant' },
  };

  const tiers: ImportanceTier[] = ['critical', 'significant', 'useful', 'situational'];

  return keyStats.slice(0, 4).map((stat, index) => {
    const key = stat.toLowerCase();
    const config = skillConfig[key] || { icon: 'default', defaultTier: tiers[index] || 'useful' };

    return {
      id: `dna-${index}`,
      label: stat,
      icon: config.icon,
      tier: index < tiers.length ? tiers[index] : config.defaultTier,
    };
  });
}
