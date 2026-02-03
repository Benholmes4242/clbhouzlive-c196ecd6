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
// NOTE: "Overall Form" is EXCLUDED - it's obvious that good form helps everywhere
const COURSE_DNA_LABELS: Record<string, string> = {
  'drive_avg': 'Driving Distance',
  'drive_acc': 'Driving Accuracy',
  'gir_pct': 'Approach Play',
  'putt_avg': 'Putting',
  'scrambling_pct': 'Short Game',
  'driving_distance': 'Driving Distance',
  'driving distance': 'Driving Distance',
  'driving_accuracy': 'Driving Accuracy',
  'driving accuracy': 'Driving Accuracy',
  'greens_in_regulation': 'Approach Play',
  'greens in regulation': 'Approach Play',
  'putting_average': 'Putting',
  'putting average': 'Putting',
  'putting': 'Putting',
  'scrambling': 'Short Game',
  'ball striking': 'Approach Play',
  'approach': 'Approach Play',
  'around the green': 'Short Game',
  'distance': 'Driving Distance',
  'accuracy': 'Driving Accuracy',
};

// Icon mapping for each label (using lucide icon names)
const COURSE_DNA_ICONS: Record<string, string> = {
  'Driving Distance': 'ruler',
  'Driving Accuracy': 'target',
  'Approach Play': 'flag',
  'Putting': 'circle',
  'Short Game': 'refresh-cw',
};

// Labels to EXCLUDE from Course DNA (not course-specific)
const EXCLUDED_LABELS = ['Overall Form', 'overall form'];

// Raw keys that map to excluded labels
const EXCLUDED_RAW_KEYS = [
  'strokes_gained_total',
  'sg_total',
  'strokes gained tee-to-green',
  'strokes gained total',
  'overall form',
  'overall',
  'tee-to-green',
];

// Driving labels to ensure at least one is always present
const DRIVING_LABELS = ['Driving Distance', 'Driving Accuracy'];

// Default stats for padding if needed (5 course-specific skills only)
const DEFAULT_STATS = [
  { label: 'Driving Distance', icon: 'ruler' },
  { label: 'Driving Accuracy', icon: 'target' },
  { label: 'Approach Play', icon: 'flag' },
  { label: 'Putting', icon: 'circle' },
  { label: 'Short Game', icon: 'refresh-cw' },
];

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
  if (lowerLabel.includes('distance') || lowerLabel.includes('drive_avg')) return 'Driving Distance';
  if (lowerLabel.includes('accuracy') || lowerLabel.includes('fairway')) return 'Driving Accuracy';
  if (lowerLabel.includes('gir') || lowerLabel.includes('green') || lowerLabel.includes('approach')) return 'Approach Play';
  if (lowerLabel.includes('putt')) return 'Putting';
  if (lowerLabel.includes('scrambl') || lowerLabel.includes('short game')) return 'Short Game';
  
  // NOTE: Do NOT map to "Overall Form" - it's excluded

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
  // Format stats with labels and EXCLUDE "Overall Form" (not course-specific)
  const formattedStats = keyStats
    .map((stat, index) => ({
      rawKey: stat.toLowerCase(),
      label: formatCourseDNALabel(stat),
      originalIndex: index,
    }))
    .filter(stat => {
      // Exclude if the raw key is in excluded list
      if (EXCLUDED_RAW_KEYS.some(ex => stat.rawKey.includes(ex))) return false;
      // Exclude if the formatted label is "Overall Form"
      if (EXCLUDED_LABELS.includes(stat.label)) return false;
      // Exclude unknown labels that weren't mapped to our 5 course-specific skills
      const validLabels = DEFAULT_STATS.map(d => d.label);
      return validLabels.includes(stat.label);
    });

  // Take top 4
  let topFour = formattedStats.slice(0, 4);

  // Check if at least one driving stat is included
  const hasDrivingStat = topFour.some(stat => 
    DRIVING_LABELS.includes(stat.label)
  );

  // If no driving stat in top 4, find the highest-ranked one and swap it in
  if (!hasDrivingStat) {
    const drivingStat = formattedStats.find(stat => 
      DRIVING_LABELS.includes(stat.label)
    );

    if (drivingStat && topFour.length >= 4) {
      // Replace the 4th item (least important) with the driving stat
      topFour[3] = drivingStat;
    } else if (drivingStat) {
      topFour.push(drivingStat);
    }
  }

  // Ensure we always have exactly 4 items - pad with defaults if needed
  while (topFour.length < 4) {
    const missing = DEFAULT_STATS.find(d => 
      !topFour.some(t => t.label === d.label)
    );
    if (missing) {
      topFour.push({ rawKey: '', label: missing.label, originalIndex: topFour.length });
    } else {
      break;
    }
  }

  // Build final CourseDNAItem array with tiers by position
  return topFour.slice(0, 4).map((stat, index) => {
    const icon = COURSE_DNA_ICONS[stat.label] || 'circle';

    return {
      id: `dna-${index}`,
      label: stat.label,
      icon,
      tier: assignTierByPosition(index),
    };
  });
}
