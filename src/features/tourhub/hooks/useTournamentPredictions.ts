/**
 * useTournamentPredictions - AI-powered tournament winner predictions
 * 
 * Analyzes upcoming tournaments and ranks players by their likelihood to win
 * based on course characteristics and player statistics.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============= Types =============

export type CourseArchetype = 'bomber' | 'precision' | 'scrambler' | 'balanced' | 'major';

export interface CourseProfile {
  archetype: CourseArchetype;
  label: string;
  description: string;
  icon: string;
  statWeights: {
    distance: number;
    accuracy: number;
    scrambling: number;
    putting: number;
    sgTotal: number;
  };
}

export interface PredictionReason {
  icon: string;
  text: string;
  statKey?: string;
  statValue?: string;
  percentile?: number;
}

export interface StatHighlight {
  label: string;
  value: string;
  rank: number;
  isStrength: boolean;
}

export interface PlayerPrediction {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  country: string;
  worldRank: number;
  earnings: number | null;
  momentum: number;
  predictionScore: number;
  winProbability: number;
  courseFitScore: number;
  formScore: number;
  reasons: PredictionReason[];
  concerns: string[];
  statHighlights: StatHighlight[];
}

export interface DarkHorse {
  player: PlayerPrediction;
  reason: string;
  icon: string;
}

export interface TournamentPrediction {
  tournament: {
    id: string;
    name: string;
    venueName: string;
    location: string;
    startDate: string;
    endDate: string;
    purse: number;
    purseFormatted: string;
    par: number;
    yardage: number;
    tourName: string;
  };
  courseProfile: CourseProfile;
  predictions: PlayerPrediction[];
  darkHorses: DarkHorse[];
  lastUpdated: string;
}

interface PlayerWithStats {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  country: string;
  worldRank: number;
  earnings: number | null;
  momentum: number;
  stats: {
    drivingDistance: number;
    drivingAccuracy: number;
    gir: number;
    scrambling: number;
    putting: number;
    sgTotal: number;
    sgPutting: number;
    sgTeeGreen: number;
  };
}

interface FieldPercentiles {
  drivingDistance: Record<string, number>;
  drivingAccuracy: Record<string, number>;
  scrambling: Record<string, number>;
  putting: Record<string, number>;
  sgTotal: Record<string, number>;
}

interface FieldRanks {
  drivingDistance: Record<string, number>;
  drivingAccuracy: Record<string, number>;
  scrambling: Record<string, number>;
  putting: Record<string, number>;
  sgTotal: Record<string, number>;
  drivingDistancePctl: Record<string, number>;
  drivingAccuracyPctl: Record<string, number>;
  scramblingPctl: Record<string, number>;
  puttingPctl: Record<string, number>;
  sgTotalPctl: Record<string, number>;
}

// ============= Course Classification =============

const MAJOR_KEYWORDS = ['Masters', 'PGA Championship', 'U.S. Open', 'Open Championship', 'Players Championship'];

export function classifyCourse(yardage: number, par: number, tournamentName: string): CourseProfile {
  // Check for majors first
  const isMajor = MAJOR_KEYWORDS.some(major => tournamentName.toLowerCase().includes(major.toLowerCase()));
  
  if (isMajor) {
    return {
      archetype: 'major',
      label: 'Major Championship',
      description: 'Demands excellence in every facet of the game',
      icon: '🏆',
      statWeights: { distance: 0.20, accuracy: 0.20, scrambling: 0.20, putting: 0.20, sgTotal: 0.20 }
    };
  }
  
  // Bomber's paradise: Long course
  if (yardage >= 7400) {
    return {
      archetype: 'bomber',
      label: "Bomber's Paradise",
      description: 'Long hitters have a significant advantage here',
      icon: '💪',
      statWeights: { distance: 0.40, accuracy: 0.15, scrambling: 0.10, putting: 0.15, sgTotal: 0.20 }
    };
  }
  
  // Precision track: Shorter, tighter
  if (yardage < 7100 || par <= 70) {
    return {
      archetype: 'precision',
      label: 'Precision Track',
      description: 'Tight fairways and small greens reward accuracy',
      icon: '🎯',
      statWeights: { distance: 0.10, accuracy: 0.35, scrambling: 0.20, putting: 0.15, sgTotal: 0.20 }
    };
  }
  
  // Scrambler's test: Par 70 or less
  if (par <= 70) {
    return {
      archetype: 'scrambler',
      label: "Scrambler's Test",
      description: 'Short game wizardry wins here',
      icon: '🛡️',
      statWeights: { distance: 0.10, accuracy: 0.20, scrambling: 0.35, putting: 0.20, sgTotal: 0.15 }
    };
  }
  
  // Balanced: Standard course
  return {
    archetype: 'balanced',
    label: 'All-Around Test',
    description: 'Rewards well-rounded players',
    icon: '⚖️',
    statWeights: { distance: 0.20, accuracy: 0.20, scrambling: 0.15, putting: 0.20, sgTotal: 0.25 }
  };
}

// ============= Field Analysis Helpers =============

function calculateFieldPercentiles(players: PlayerWithStats[]): FieldPercentiles {
  const sortedByDistance = [...players].sort((a, b) => b.stats.drivingDistance - a.stats.drivingDistance);
  const sortedByAccuracy = [...players].sort((a, b) => b.stats.drivingAccuracy - a.stats.drivingAccuracy);
  const sortedByScrambling = [...players].sort((a, b) => b.stats.scrambling - a.stats.scrambling);
  const sortedByPutting = [...players].sort((a, b) => a.stats.putting - b.stats.putting); // Lower is better
  const sortedBySgTotal = [...players].sort((a, b) => b.stats.sgTotal - a.stats.sgTotal);

  const n = players.length;
  const percentiles: FieldPercentiles = {
    drivingDistance: {},
    drivingAccuracy: {},
    scrambling: {},
    putting: {},
    sgTotal: {},
  };

  sortedByDistance.forEach((p, i) => {
    percentiles.drivingDistance[p.playerId] = Math.round(((n - i) / n) * 100);
  });
  sortedByAccuracy.forEach((p, i) => {
    percentiles.drivingAccuracy[p.playerId] = Math.round(((n - i) / n) * 100);
  });
  sortedByScrambling.forEach((p, i) => {
    percentiles.scrambling[p.playerId] = Math.round(((n - i) / n) * 100);
  });
  sortedByPutting.forEach((p, i) => {
    percentiles.putting[p.playerId] = Math.round(((n - i) / n) * 100);
  });
  sortedBySgTotal.forEach((p, i) => {
    percentiles.sgTotal[p.playerId] = Math.round(((n - i) / n) * 100);
  });

  return percentiles;
}

function calculateFieldRanks(players: PlayerWithStats[]): FieldRanks {
  const sortedByDistance = [...players].sort((a, b) => b.stats.drivingDistance - a.stats.drivingDistance);
  const sortedByAccuracy = [...players].sort((a, b) => b.stats.drivingAccuracy - a.stats.drivingAccuracy);
  const sortedByScrambling = [...players].sort((a, b) => b.stats.scrambling - a.stats.scrambling);
  const sortedByPutting = [...players].sort((a, b) => a.stats.putting - b.stats.putting);
  const sortedBySgTotal = [...players].sort((a, b) => b.stats.sgTotal - a.stats.sgTotal);

  const n = players.length;
  const ranks: FieldRanks = {
    drivingDistance: {},
    drivingAccuracy: {},
    scrambling: {},
    putting: {},
    sgTotal: {},
    drivingDistancePctl: {},
    drivingAccuracyPctl: {},
    scramblingPctl: {},
    puttingPctl: {},
    sgTotalPctl: {},
  };

  sortedByDistance.forEach((p, i) => {
    ranks.drivingDistance[p.playerId] = i + 1;
    ranks.drivingDistancePctl[p.playerId] = Math.round(((n - i) / n) * 100);
  });
  sortedByAccuracy.forEach((p, i) => {
    ranks.drivingAccuracy[p.playerId] = i + 1;
    ranks.drivingAccuracyPctl[p.playerId] = Math.round(((n - i) / n) * 100);
  });
  sortedByScrambling.forEach((p, i) => {
    ranks.scrambling[p.playerId] = i + 1;
    ranks.scramblingPctl[p.playerId] = Math.round(((n - i) / n) * 100);
  });
  sortedByPutting.forEach((p, i) => {
    ranks.putting[p.playerId] = i + 1;
    ranks.puttingPctl[p.playerId] = Math.round(((n - i) / n) * 100);
  });
  sortedBySgTotal.forEach((p, i) => {
    ranks.sgTotal[p.playerId] = i + 1;
    ranks.sgTotalPctl[p.playerId] = Math.round(((n - i) / n) * 100);
  });

  return ranks;
}

// ============= Prediction Scoring =============

function calculatePredictionScore(
  player: PlayerWithStats,
  courseProfile: CourseProfile,
  fieldPercentiles: FieldPercentiles
): number {
  const weights = courseProfile.statWeights;
  
  const distanceScore = fieldPercentiles.drivingDistance[player.playerId] || 50;
  const accuracyScore = fieldPercentiles.drivingAccuracy[player.playerId] || 50;
  const scramblingScore = fieldPercentiles.scrambling[player.playerId] || 50;
  const puttingScore = fieldPercentiles.putting[player.playerId] || 50;
  const sgTotalScore = fieldPercentiles.sgTotal[player.playerId] || 50;
  
  const courseFitScore = (
    (distanceScore * weights.distance) +
    (accuracyScore * weights.accuracy) +
    (scramblingScore * weights.scrambling) +
    (puttingScore * weights.putting) +
    (sgTotalScore * weights.sgTotal)
  );
  
  // World rank score (inverse)
  const rankScore = Math.max(0, 100 - (player.worldRank * 0.5));
  
  // Momentum score
  const momentumScore = 50 + Math.max(-30, Math.min(30, player.momentum * 2));
  
  const predictionScore = (
    (courseFitScore * 0.35) +
    (rankScore * 0.30) +
    (sgTotalScore * 0.20) +
    (momentumScore * 0.15)
  );
  
  return Math.round(predictionScore);
}

function calculateCourseFitScore(
  player: PlayerWithStats,
  courseProfile: CourseProfile,
  fieldPercentiles: FieldPercentiles
): number {
  const weights = courseProfile.statWeights;
  
  const distanceScore = fieldPercentiles.drivingDistance[player.playerId] || 50;
  const accuracyScore = fieldPercentiles.drivingAccuracy[player.playerId] || 50;
  const scramblingScore = fieldPercentiles.scrambling[player.playerId] || 50;
  const puttingScore = fieldPercentiles.putting[player.playerId] || 50;
  const sgTotalScore = fieldPercentiles.sgTotal[player.playerId] || 50;
  
  return Math.round(
    (distanceScore * weights.distance) +
    (accuracyScore * weights.accuracy) +
    (scramblingScore * weights.scrambling) +
    (puttingScore * weights.putting) +
    (sgTotalScore * weights.sgTotal)
  );
}

function calculateFormScore(player: PlayerWithStats): number {
  // Base form on world rank and momentum
  const rankComponent = Math.max(0, 100 - player.worldRank);
  const momentumComponent = 50 + Math.max(-30, Math.min(30, player.momentum * 3));
  return Math.round((rankComponent * 0.6) + (momentumComponent * 0.4));
}

function calculateWinProbabilities(predictions: PlayerPrediction[]): PlayerPrediction[] {
  const sorted = [...predictions].sort((a, b) => b.predictionScore - a.predictionScore);
  const topScore = sorted[0]?.predictionScore || 0;
  
  return sorted.map((player, index) => {
    let probability: number;
    
    if (index === 0) {
      probability = 20 + ((player.predictionScore / Math.max(topScore, 1)) * 15);
    } else if (index < 5) {
      const ratio = player.predictionScore / Math.max(topScore, 1);
      const leaderProb = 20 + ((sorted[0].predictionScore / Math.max(topScore, 1)) * 15);
      probability = ratio * leaderProb * 0.8;
    } else if (index < 10) {
      probability = 3 + (10 - index) * 0.5;
    } else {
      probability = Math.max(0.5, 3 - (index - 10) * 0.2);
    }
    
    return {
      ...player,
      winProbability: Math.round(probability * 10) / 10
    };
  });
}

// ============= Reason & Concern Generation =============

function generateReasons(
  player: PlayerWithStats,
  courseProfile: CourseProfile,
  fieldRanks: FieldRanks
): PredictionReason[] {
  const reasons: PredictionReason[] = [];
  const weights = courseProfile.statWeights;
  
  // World rank reason
  if (player.worldRank <= 5) {
    reasons.push({
      icon: '👑',
      text: `World #${player.worldRank} - Elite tier player`,
    });
  } else if (player.worldRank <= 20) {
    reasons.push({
      icon: '🏆',
      text: `World #${player.worldRank} - Championship caliber`,
    });
  }
  
  // Momentum reason - lowered threshold from 10 to 5
  if (player.momentum >= 5) {
    reasons.push({
      icon: '🔥',
      text: `Hot form - up ${player.momentum} spots this week`,
    });
  }
  
  // Course fit reasons - lowered thresholds
  if (weights.distance >= 0.2 && (fieldRanks.drivingDistance[player.playerId] || 999) <= 10) {
    reasons.push({
      icon: '💪',
      text: `#${fieldRanks.drivingDistance[player.playerId]} in driving distance`,
      statKey: 'drive_avg',
      statValue: `${player.stats.drivingDistance.toFixed(1)} yds`,
      percentile: fieldRanks.drivingDistancePctl[player.playerId]
    });
  }
  
  if (weights.accuracy >= 0.2 && (fieldRanks.drivingAccuracy[player.playerId] || 999) <= 10) {
    reasons.push({
      icon: '🎯',
      text: `#${fieldRanks.drivingAccuracy[player.playerId]} in driving accuracy`,
      statKey: 'drive_acc',
      statValue: `${player.stats.drivingAccuracy.toFixed(1)}%`,
      percentile: fieldRanks.drivingAccuracyPctl[player.playerId]
    });
  }
  
  if (weights.scrambling >= 0.15 && (fieldRanks.scrambling[player.playerId] || 999) <= 10) {
    reasons.push({
      icon: '🛡️',
      text: `#${fieldRanks.scrambling[player.playerId]} in scrambling`,
      statKey: 'scrambling_pct',
      statValue: `${player.stats.scrambling.toFixed(1)}%`,
      percentile: fieldRanks.scramblingPctl[player.playerId]
    });
  }
  
  if ((fieldRanks.sgTotal[player.playerId] || 999) <= 5) {
    reasons.push({
      icon: '📊',
      text: `#${fieldRanks.sgTotal[player.playerId]} in Strokes Gained Total`,
      statKey: 'strokes_gained_total',
      statValue: player.stats.sgTotal > 0 ? `+${player.stats.sgTotal.toFixed(2)}` : player.stats.sgTotal.toFixed(2),
      percentile: fieldRanks.sgTotalPctl[player.playerId]
    });
  }
  
  // Fallback reasons to ensure at least 3
  const fallbackReasons: PredictionReason[] = [];
  
  // SG Total fallback (if not already added and player has good SG)
  if (player.stats.sgTotal > 0.5 && !reasons.some(r => r.statKey === 'strokes_gained_total')) {
    fallbackReasons.push({
      icon: '📊',
      text: `+${player.stats.sgTotal.toFixed(1)} strokes gained per round`,
    });
  }
  
  // Top 20 fallback (if not already covered by world rank)
  if (player.worldRank > 20 && player.worldRank <= 50 && !reasons.some(r => r.text.includes('World'))) {
    fallbackReasons.push({
      icon: '🌍',
      text: `World #${player.worldRank} - Top 50 player`,
    });
  }
  
  // Putting fallback
  if ((fieldRanks.putting[player.playerId] || 999) <= 15) {
    fallbackReasons.push({
      icon: '🎯',
      text: `#${fieldRanks.putting[player.playerId]} in putting this field`,
    });
  }
  
  // Strong scrambling fallback (lower threshold)
  if ((fieldRanks.scrambling[player.playerId] || 999) <= 20 && !reasons.some(r => r.statKey === 'scrambling_pct')) {
    fallbackReasons.push({
      icon: '🛡️',
      text: `Top 20 scrambler in this field`,
    });
  }
  
  // Good distance fallback
  if ((fieldRanks.drivingDistance[player.playerId] || 999) <= 20 && !reasons.some(r => r.statKey === 'drive_avg')) {
    fallbackReasons.push({
      icon: '💪',
      text: `Top 20 in driving distance`,
    });
  }
  
  // Add fallbacks until we have at least 3 reasons
  while (reasons.length < 3 && fallbackReasons.length > 0) {
    const fallback = fallbackReasons.shift();
    if (fallback) {
      reasons.push(fallback);
    }
  }
  
  return reasons.slice(0, 3);
}

function generateConcerns(
  player: PlayerWithStats,
  courseProfile: CourseProfile,
  fieldRanks: FieldRanks,
  totalPlayers: number
): string[] {
  const concerns: string[] = [];
  const weights = courseProfile.statWeights;
  const threshold = Math.round(totalPlayers * 0.75);
  
  if (weights.distance >= 0.3 && (fieldRanks.drivingDistance[player.playerId] || 0) > threshold) {
    concerns.push('Below average driving distance for this course');
  }
  
  if (weights.accuracy >= 0.3 && (fieldRanks.drivingAccuracy[player.playerId] || 0) > threshold) {
    concerns.push('Accuracy could be a concern on tight fairways');
  }
  
  if (weights.scrambling >= 0.25 && (fieldRanks.scrambling[player.playerId] || 0) > threshold) {
    concerns.push('Short game may be tested');
  }
  
  if (weights.putting >= 0.2 && (fieldRanks.putting[player.playerId] || 0) > threshold) {
    concerns.push('Putting can be inconsistent');
  }
  
  if (player.momentum < -5) {
    concerns.push(`Recent form dip - dropped ${Math.abs(player.momentum)} spots`);
  }
  
  return concerns.slice(0, 2);
}

function generateStatHighlights(
  player: PlayerWithStats,
  fieldRanks: FieldRanks
): StatHighlight[] {
  const highlights: StatHighlight[] = [];
  
  const distRank = fieldRanks.drivingDistance[player.playerId] || 999;
  const accRank = fieldRanks.drivingAccuracy[player.playerId] || 999;
  const scrRank = fieldRanks.scrambling[player.playerId] || 999;
  const puttRank = fieldRanks.putting[player.playerId] || 999;
  const sgRank = fieldRanks.sgTotal[player.playerId] || 999;
  
  highlights.push({
    label: 'Driving Distance',
    value: `${player.stats.drivingDistance.toFixed(1)} yds`,
    rank: distRank,
    isStrength: distRank <= 20
  });
  
  highlights.push({
    label: 'Driving Accuracy',
    value: `${player.stats.drivingAccuracy.toFixed(1)}%`,
    rank: accRank,
    isStrength: accRank <= 20
  });
  
  highlights.push({
    label: 'Scrambling',
    value: `${player.stats.scrambling.toFixed(1)}%`,
    rank: scrRank,
    isStrength: scrRank <= 20
  });
  
  highlights.push({
    label: 'SG: Total',
    value: player.stats.sgTotal > 0 ? `+${player.stats.sgTotal.toFixed(2)}` : player.stats.sgTotal.toFixed(2),
    rank: sgRank,
    isStrength: sgRank <= 20
  });
  
  return highlights;
}

// ============= Dark Horse Selection =============

function selectDarkHorses(
  predictions: PlayerPrediction[],
  courseProfile: CourseProfile
): DarkHorse[] {
  const darkHorses: DarkHorse[] = [];
  
  // Find players ranked 30-100 who have potential
  const outsiders = predictions.filter(p => p.worldRank >= 30 && p.worldRank <= 100);
  
  // Biggest mover in the field (among outsiders)
  const biggestMover = [...predictions]
    .filter(p => p.worldRank >= 20)
    .sort((a, b) => b.momentum - a.momentum)[0];
  
  if (biggestMover && biggestMover.momentum >= 10) {
    darkHorses.push({
      player: biggestMover,
      reason: `Biggest mover: up ${biggestMover.momentum} spots`,
      icon: '🚀'
    });
  }
  
  // Best course fit among outsiders
  const bestFitOutsider = outsiders.sort((a, b) => b.courseFitScore - a.courseFitScore)[0];
  if (bestFitOutsider && bestFitOutsider.courseFitScore >= 60 && 
      !darkHorses.some(dh => dh.player.playerId === bestFitOutsider.playerId)) {
    darkHorses.push({
      player: bestFitOutsider,
      reason: `Perfect course fit (${bestFitOutsider.courseFitScore}/100)`,
      icon: '🎯'
    });
  }
  
  // High form score outsider
  const hotFormOutsider = outsiders
    .filter(p => !darkHorses.some(dh => dh.player.playerId === p.playerId))
    .sort((a, b) => b.formScore - a.formScore)[0];
  if (hotFormOutsider && hotFormOutsider.formScore >= 50) {
    darkHorses.push({
      player: hotFormOutsider,
      reason: 'Playing well above ranking',
      icon: '🔥'
    });
  }
  
  return darkHorses.slice(0, 3);
}

// ============= Main Hook =============

export function useTournamentPredictions(tournamentId?: string) {
  return useQuery({
    queryKey: ['tournament-predictions', tournamentId],
    queryFn: async (): Promise<TournamentPrediction | null> => {
      // Get upcoming PGA tournament
      let tournamentQuery = supabase
        .from('sr_tournaments')
        .select(`
          id,
          name,
          venue_name,
          venue_city,
          venue_state,
          venue_country,
          start_date,
          end_date,
          purse,
          venue_par,
          venue_yardage,
          raw_data,
          season:sr_seasons!inner(tour_name, year)
        `)
        .eq('status', 'scheduled')
        .ilike('sr_seasons.tour_name', '%pga%')
        .order('start_date', { ascending: true });
      
      if (tournamentId) {
        tournamentQuery = tournamentQuery.eq('id', tournamentId);
      }
      
      const { data: tournaments, error: tournamentError } = await tournamentQuery.limit(1);
      
      if (tournamentError || !tournaments?.length) {
        console.log('[Predictions] No upcoming PGA tournament found');
        return null;
      }
      
      const tournament = tournaments[0];
      const rawData = tournament.raw_data as Record<string, unknown> | null;
      const courseData = (rawData?.venue as Record<string, unknown>)?.courses as Array<Record<string, unknown>> | undefined;
      const firstCourse = courseData?.[0] || {};
      const yardage = tournament.venue_yardage || (firstCourse.yardage as number) || 7200;
      const par = tournament.venue_par || (firstCourse.par as number) || 72;
      
      // Classify course
      const courseProfile = classifyCourse(yardage, par, tournament.name);
      
      // Get all players with 2025 PGA stats
      const { data: playersWithStats } = await supabase
        .from('sr_player_statistics')
        .select(`
          raw_data,
          player:sr_players!inner(
            id, first_name, last_name, photo_url, country, pga_tour_id
          ),
          season:sr_seasons!inner(year, tour_name)
        `)
        .eq('season.year', 2025)
        .ilike('season.tour_name', '%pga%');
      
      if (!playersWithStats?.length) {
        console.log('[Predictions] No player stats found');
        return null;
      }
      
      // Get world rankings
      const playerIds = playersWithStats.map(p => (p.player as { id: string }).id);
      const { data: rankings } = await supabase
        .from('sr_world_rankings')
        .select('player_id, rank, prior_rank, points, raw_data')
        .in('player_id', playerIds);
      
      const rankingMap = new Map(rankings?.map(r => [r.player_id, r]));
      
      // Build player data
      const playersData: PlayerWithStats[] = playersWithStats
        .map(ps => {
          const player = ps.player as { id: string; first_name: string; last_name: string; photo_url: string | null; country: string; pga_tour_id: string | null };
          const ranking = rankingMap.get(player.id);
          const rawStats = ps.raw_data as Record<string, unknown> | null;
          const stats = (rawStats?.statistics as Record<string, unknown>) || {};
          
          return {
            playerId: player.id,
            playerName: `${player.first_name} ${player.last_name}`,
            photoUrl: player.photo_url,
            pgaTourId: player.pga_tour_id || null,
            country: player.country || 'USA',
            worldRank: ranking?.rank || 999,
            earnings: parseFloat(String(stats.earnings)) || null,
            momentum: ranking?.prior_rank ? ranking.prior_rank - ranking.rank : 0,
            stats: {
              drivingDistance: parseFloat(String(stats.drive_avg)) || 280,
              drivingAccuracy: parseFloat(String(stats.drive_acc)) || 50,
              gir: parseFloat(String(stats.gir_pct)) || 60,
              scrambling: parseFloat(String(stats.scrambling_pct)) || 50,
              putting: parseFloat(String(stats.putt_avg)) || 1.8,
              sgTotal: parseFloat(String(stats.strokes_gained_total)) || 0,
              sgPutting: parseFloat(String(stats.strokes_gained)) || 0,
              sgTeeGreen: parseFloat(String(stats.strokes_gained_tee_green)) || 0,
            }
          };
        })
        .filter(p => p.worldRank <= 200);
      
      if (playersData.length === 0) {
        console.log('[Predictions] No ranked players found');
        return null;
      }
      
      // Calculate field metrics
      const fieldPercentiles = calculateFieldPercentiles(playersData);
      const fieldRanks = calculateFieldRanks(playersData);
      
      // Generate predictions
      let predictions: PlayerPrediction[] = playersData.map(player => {
        const predictionScore = calculatePredictionScore(player, courseProfile, fieldPercentiles);
        const courseFitScore = calculateCourseFitScore(player, courseProfile, fieldPercentiles);
        const formScore = calculateFormScore(player);
        const reasons = generateReasons(player, courseProfile, fieldRanks);
        const concerns = generateConcerns(player, courseProfile, fieldRanks, playersData.length);
        const statHighlights = generateStatHighlights(player, fieldRanks);
        
        return {
          playerId: player.playerId,
          playerName: player.playerName,
          photoUrl: player.photoUrl,
          pgaTourId: player.pgaTourId,
          country: player.country,
          worldRank: player.worldRank,
          earnings: player.earnings,
          momentum: player.momentum,
          predictionScore,
          winProbability: 0,
          courseFitScore,
          formScore,
          reasons,
          concerns,
          statHighlights,
        };
      });
      
      // Calculate win probabilities
      predictions = calculateWinProbabilities(predictions);
      
      // Select dark horses
      const darkHorses = selectDarkHorses(predictions, courseProfile);
      
      // Format purse
      const purseNum = typeof tournament.purse === 'number' ? tournament.purse : 0;
      const purseFormatted = purseNum >= 1000000 
        ? `$${(purseNum / 1000000).toFixed(1)}M`
        : purseNum >= 1000
        ? `$${(purseNum / 1000).toFixed(0)}K`
        : `$${purseNum}`;
      
      // Format location
      const locationParts = [
        tournament.venue_city,
        tournament.venue_state,
        tournament.venue_country
      ].filter(Boolean);
      
      const seasonData = tournament.season as { tour_name: string; year: number } | null;
      
      return {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          venueName: tournament.venue_name || 'TBD',
          location: locationParts.join(', '),
          startDate: tournament.start_date,
          endDate: tournament.end_date,
          purse: purseNum,
          purseFormatted,
          par,
          yardage,
          tourName: seasonData?.tour_name || 'PGA Tour',
        },
        courseProfile,
        predictions: predictions.slice(0, 20),
        darkHorses,
        lastUpdated: new Date().toISOString(),
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: true,
  });
}

// Convenience hook for next upcoming tournament
export function useNextTournamentPredictions() {
  return useTournamentPredictions();
}
