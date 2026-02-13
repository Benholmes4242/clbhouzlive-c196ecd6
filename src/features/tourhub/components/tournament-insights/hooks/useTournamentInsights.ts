/**
 * useTournamentInsights - Transforms AI predictions into the 2.0 narrative shape
 * Now supports three tournament phases: pre-tournament, in-progress, completed
 */

import { useMemo } from 'react';
import { useAIPredictions } from '../../../hooks/useAIPredictions';
import { usePredictionTracker } from '../../../hooks/usePredictionTracker';
import { format, parseISO } from 'date-fns';
import { getFallbackCourseImage } from '../../../hooks/useVenueImage';
import type { 
  TournamentInsightsData, 
  CourseDNAItem, 
  ConfidenceTier, 
  ImportanceTier,
  ContenderCard,
  TournamentPhase,
  PredictionTrackerData,
  NextTournamentPreview,
} from '../types';

export function useTournamentInsights() {
  const {
    data: aiData,
    isLoading,
    error,
    tournamentPhase,
    activeTournamentId,
    nextTournament,
    nextTournamentPredictions,
  } = useAIPredictions();

  // Fetch live tracker data when tournament is in-progress or completed
  const isLiveOrCompleted = tournamentPhase === 'in-progress' || tournamentPhase === 'completed';
  const trackerQuery = usePredictionTracker(
    isLiveOrCompleted ? activeTournamentId : null,
    isLiveOrCompleted ? aiData : null
  );

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

      courseDNA: deduplicateByLabel(transformCourseDNA(courseAnalysis?.keyStats || [])),

      clubhouseIntelligence: {
        primaryText: extractPrimaryText(courseAnalysis?.insight),
        expandedText: (courseAnalysis as any)?.skillsAnalysis || generateSkillsAnalysis(courseAnalysis?.keyStats),
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

      contenderCards: buildContenderCards(topContenders, darkHorses),
    };
  }, [aiData]);

  return {
    data,
    isLoading,
    error,
    tournamentPhase,
    tracker: trackerQuery.data as PredictionTrackerData | undefined ?? null,
    trackerLoading: trackerQuery.isLoading,
    nextTournament,
    nextTournamentPredictions,
  };
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Removes duplicate items by label (keeps first occurrence)
 */
const deduplicateByLabel = (items: CourseDNAItem[]): CourseDNAItem[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  });
};

/**
 * Limits text to maxLength, cutting at word boundaries
 * Never cuts mid-word, never adds ellipsis
 */
function limitText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  // Find the last space before or at maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  // If we found a space and it's not too far back, cut there
  if (lastSpace > maxLength * 0.6) {
    return truncated.slice(0, lastSpace);
  }

  // Fallback: cut at maxLength (rare edge case)
  return truncated;
}

function buildContenderCards(
  topContenders: any[],
  darkHorses: any[]
): ContenderCard[] {
  // Contenders #2-5 (skip #1, that's the featured card)
  const contenders: ContenderCard[] = topContenders.slice(1, 5).map((p, i) => ({
    id: p.playerId,
    name: p.playerName,
    countryCode: p.country,
    avatarUrl: p.photoUrl || '',
    description: limitText(p.reasons?.[0] || '', 50), // 50 char max
    type: 'contender' as const,
    rank: i + 2,
    confidenceTier: getConfidenceTier(i + 1),
  }));

  // Threats (formerly Dangerous Profiles)
  const threats: ContenderCard[] = darkHorses.slice(0, 3).map((dh) => ({
    id: dh.playerId,
    name: dh.playerName,
    avatarUrl: dh.photoUrl || '',
    description: limitText(dh.hook, 50), // 50 char max
    type: 'threat' as const,
    traitLabel: extractTraitLabel(dh.keyStat), // 25 char max via function
  }));

  return [...contenders, ...threats];
}

function getConfidenceTier(rank: number): ConfidenceTier {
  if (rank === 0) return 'elite';
  if (rank <= 2) return 'high';
  return 'medium';
}

/**
 * Converts keyStat to clean skill label (max 25 chars)
 * Removes all numbers and percentages
 */
function extractTraitLabel(keyStat: string | undefined): string {
  if (!keyStat) return 'DARK HORSE';
  
  const lower = keyStat.toLowerCase();
  
  // Map to clean skill labels
  if (lower.includes('putting')) return 'ELITE PUTTING';
  if (lower.includes('driving') && lower.includes('accuracy')) return 'ELITE ACCURACY';
  if (lower.includes('driving') && lower.includes('distance')) return 'BIG HITTER';
  if (lower.includes('distance')) return 'BIG HITTER';
  if (lower.includes('scrambling')) return 'GREAT SHORT GAME';
  if (lower.includes('gir') || lower.includes('greens')) return 'IRON SPECIALIST';
  if (lower.includes('approach')) return 'APPROACH EXPERT';
  if (lower.includes('iron')) return 'ELITE IRONS';
  if (lower.includes('ball strik')) return 'GREAT BALL STRIKER';
  if (lower.includes('tee to green') || lower.includes('tee-to-green')) return 'ELITE TEE-TO-GREEN';
  
  // Fallback: clean up and limit to 25 chars
  const cleaned = keyStat
    .replace(/[\d.]+%?/g, '')    // Remove numbers and percentages
    .replace(/\s+/g, ' ')         // Clean up extra spaces
    .trim()
    .toUpperCase();
  
  return limitText(cleaned, 25);
}

function extractKeyTag(reason: string | undefined): string | undefined {
  if (!reason) return undefined;
  
  // Extract first 2-3 words as a tag
  const words = reason.split(' ').slice(0, 3);
  if (words.length < 2) return reason;
  
  return words.join(' ');
}

function extractPrimaryText(insight: string | undefined): string {
  if (!insight) return 'Analysis powered by Clubhouse Intelligence.';
  
  // Return the full insight as the primary text (it's typically 1-2 sentences)
  return insight.trim();
}

/**
 * Formats a list of skills with proper grammar (Oxford comma style)
 * Examples:
 * - ["putting"] → "putting"
 * - ["putting", "approach play"] → "putting and approach play"
 * - ["putting", "approach play", "driving"] → "putting, approach play, and driving"
 */
function formatSkillList(skills: string[]): string {
  if (skills.length === 0) return '';
  if (skills.length === 1) return skills[0];
  if (skills.length === 2) return `${skills[0]} and ${skills[1]}`;
  return `${skills.slice(0, -1).join(', ')}, and ${skills[skills.length - 1]}`;
}

function generateSkillsAnalysis(keyStats: string[] | undefined): string | undefined {
  if (!keyStats || keyStats.length === 0) return undefined;
  
  // Generate a skills-focused analysis based on the key stats
  // Use Set to deduplicate labels that may map to the same skill
  const uniqueSkills = new Set<string>();
  
  keyStats.slice(0, 4).forEach(stat => {
    const formatted = formatCourseDNALabel(stat);
    // Only add valid labels that aren't the raw stat itself
    if (formatted && formatted !== stat) {
      uniqueSkills.add(formatted.toLowerCase());
    }
  });
  
  const skillsArray = Array.from(uniqueSkills).slice(0, 3);
  if (skillsArray.length === 0) return undefined;
  
  const skillList = formatSkillList(skillsArray);
  return `This week, ${skillList} will be the key differentiators. Players who excel in these areas historically perform well at venues with similar characteristics.`;
}

// Label mapping from database fields to friendly terms
// NOTE: "Overall Form" is EXCLUDED - it's obvious that good form helps everywhere
const COURSE_DNA_LABELS: Record<string, string> = {
  // Primary stat keys
  'drive_avg': 'Driving Distance',
  'drive_acc': 'Driving Accuracy',
  'gir_pct': 'Approach Play',
  'putt_avg': 'Putting Precision',
  'scrambling_pct': 'Short Game',
  // Variations
  'driving_distance': 'Driving Distance',
  'driving distance': 'Driving Distance',
  'driving_accuracy': 'Driving Accuracy',
  'driving accuracy': 'Driving Accuracy',
  'distance': 'Driving Distance',
  'accuracy': 'Driving Accuracy',
  'greens_in_regulation': 'Approach Play',
  'greens in regulation': 'Approach Play',
  'putting_average': 'Putting Precision',
  'putting average': 'Putting Precision',
  'putting': 'Putting Precision',
  'scrambling': 'Short Game',
  'ball striking': 'Approach Play',
  'approach': 'Approach Play',
  'around the green': 'Short Game',
};

// Icon mapping for each label (using lucide icon names)
const COURSE_DNA_ICONS: Record<string, string> = {
  'Driving Distance': 'ruler',
  'Driving Accuracy': 'target',
  'Approach Play': 'flag',
  'Putting Precision': 'circle',
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
  { label: 'Putting Precision', icon: 'circle' },
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
  if (lowerLabel.includes('distance') || lowerLabel.includes('drive_avg') || lowerLabel.includes('driving dist')) return 'Driving Distance';
  if (lowerLabel.includes('accuracy') || lowerLabel.includes('fairway') || lowerLabel.includes('drive_acc')) return 'Driving Accuracy';
  if (lowerLabel.includes('gir') || lowerLabel.includes('green') || lowerLabel.includes('approach') || lowerLabel.includes('iron')) return 'Approach Play';
  if (lowerLabel.includes('putt')) return 'Putting Precision';
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
