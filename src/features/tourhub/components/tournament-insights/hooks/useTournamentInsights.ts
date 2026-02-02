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

// Label mapping from database fields to relatable terms
const COURSE_DNA_LABELS: Record<string, string> = {
  'drive_avg': 'Distance',
  'drive_acc': 'Accuracy',
  'gir_pct': 'Approach Play',
  'putt_avg': 'Putting',
  'scrambling_pct': 'Short Game',
  'strokes_gained_total': 'Overall Form',
  'driving_distance': 'Distance',
  'driving distance': 'Distance',
  'driving_accuracy': 'Accuracy',
  'driving accuracy': 'Accuracy',
  'greens_in_regulation': 'Approach Play',
  'greens in regulation': 'Approach Play',
  'putting_average': 'Putting',
  'putting average': 'Putting',
  'putting': 'Putting',
  'scrambling': 'Short Game',
  'sg_total': 'Overall Form',
  'strokes gained tee-to-green': 'Overall Form',
  'strokes gained total': 'Overall Form',
  'ball striking': 'Approach Play',
  'approach': 'Approach Play',
  'around the green': 'Short Game',
  'distance': 'Distance',
  'accuracy': 'Accuracy',
};

// Icon mapping for each label
const COURSE_DNA_ICONS: Record<string, string> = {
  'Distance': 'distance',
  'Accuracy': 'accuracy',
  'Approach Play': 'accuracy',
  'Putting': 'putting',
  'Short Game': 'scrambling',
  'Overall Form': 'default',
};

function formatCourseDNALabel(rawLabel: string): string {
  const key = rawLabel.toLowerCase().replace(/\s+/g, '_');
  if (COURSE_DNA_LABELS[key]) {
    return COURSE_DNA_LABELS[key];
  }

  const keyWithSpaces = rawLabel.toLowerCase();
  if (COURSE_DNA_LABELS[keyWithSpaces]) {
    return COURSE_DNA_LABELS[keyWithSpaces];
  }

  // Fallback: check if label contains key terms
  const lowerLabel = rawLabel.toLowerCase();
  if (lowerLabel.includes('distance') || lowerLabel.includes('drive_avg')) return 'Distance';
  if (lowerLabel.includes('accuracy') || lowerLabel.includes('fairway')) return 'Accuracy';
  if (lowerLabel.includes('gir') || lowerLabel.includes('green') || lowerLabel.includes('approach')) return 'Approach Play';
  if (lowerLabel.includes('putt')) return 'Putting';
  if (lowerLabel.includes('scrambl') || lowerLabel.includes('short game')) return 'Short Game';
  if (lowerLabel.includes('strokes') || lowerLabel.includes('sg_') || lowerLabel.includes('overall') || lowerLabel.includes('tee-to-green')) return 'Overall Form';

  // Final fallback: return original
  return rawLabel;
}

function assignTierByPosition(index: number): ImportanceTier {
  switch (index) {
    case 0: return 'critical';
    case 1: return 'significant';
    case 2:
    case 3:
    default: return 'useful';
  }
}

function transformCourseDNA(keyStats: string[]): CourseDNAItem[] {
  return keyStats.slice(0, 4).map((stat, index) => {
    const label = formatCourseDNALabel(stat);
    const icon = COURSE_DNA_ICONS[label] || 'default';

    return {
      id: `dna-${index}`,
      label,
      icon,
      tier: assignTierByPosition(index),
    };
  });
}
