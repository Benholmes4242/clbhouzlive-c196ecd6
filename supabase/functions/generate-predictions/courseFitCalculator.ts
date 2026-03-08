/**
 * Priority 2: Player-Course Fit Score Calculator (Adapted to Available Stats)
 * 
 * Calculates a genuine, data-driven course fit score (0-100) for each player
 * based on the course DNA profile and the player's statistics.
 * 
 * Uses the stats actually available from Sportradar:
 * - Direct stats: driveAvg, driveAcc, girPct, scramblingPct, puttAvg, 
 *                 sgTotal, sgTeeToGreen, holeProximityAvg, birdiesPerRound, scoringAvg
 * - Derived proxies: sgPuttingProxy, sgApproachProxy, sgOffTeeProxy, sgAroundGreenProxy
 * 
 * The formula: weighted average of player percentiles in stats that matter at this venue.
 */

import type { PlayerStats } from './detailedStats';

export interface CourseDNAProfile {
  venueName: string;
  drivingDistanceImportance: number;
  drivingAccuracyImportance: number;
  girImportance: number;
  scramblingImportance: number;
  puttingImportance: number;
  sgOffTeeImportance: number;
  sgApproachImportance: number;
  sgAroundGreenImportance: number;
  sgPuttingImportance: number;
  courseType: string;
  avgWinningScore: number | null;
}

export interface CourseFitResult {
  playerId: string;
  playerName: string;
  fitScore: number;           // 0-100, the real match %
  fitBreakdown: FitBreakdownItem[];
  strengths: string[];        // Top 2-3 stat matches
  weaknesses: string[];       // Bottom 1-2 stat mismatches
}

interface FitBreakdownItem {
  statName: string;
  importance: number;         // How much this stat matters at the venue (0-100)
  playerPercentile: number;   // Player's rank in this stat vs field (0-100)
  contribution: number;       // importance × percentile / 100
}

/**
 * Calculate percentiles for each stat across the field.
 * Returns a map of playerId → { statKey: percentile (0-100) }
 */
function calculateFieldPercentiles(
  players: PlayerStats[],
): Map<string, Record<string, number>> {
  // All stat keys we can use — direct + derived proxies
  const statConfigs: Array<{ key: keyof PlayerStats; lowerIsBetter: boolean }> = [
    { key: 'driveAvg', lowerIsBetter: false },
    { key: 'driveAcc', lowerIsBetter: false },
    { key: 'girPct', lowerIsBetter: false },
    { key: 'scramblingPct', lowerIsBetter: false },
    { key: 'puttAvg', lowerIsBetter: true },        // Lower putts = better
    { key: 'sgTotal', lowerIsBetter: false },
    { key: 'sgTeeToGreen', lowerIsBetter: false },
    { key: 'holeProximityAvg', lowerIsBetter: true }, // Closer = better
    { key: 'birdiesPerRound', lowerIsBetter: false },
    { key: 'scoringAvg', lowerIsBetter: true },       // Lower scoring avg = better
    { key: 'sgPuttingProxy', lowerIsBetter: false },
    { key: 'sgApproachProxy', lowerIsBetter: false },
    { key: 'sgOffTeeProxy', lowerIsBetter: false },
    { key: 'sgAroundGreenProxy', lowerIsBetter: false },
  ];

  const percentiles = new Map<string, Record<string, number>>();

  for (const { key, lowerIsBetter } of statConfigs) {
    const values = players
      .filter((p) => (p[key] as any) !== null && (p[key] as any) !== undefined)
      .map((p) => ({ id: p.playerId, value: p[key] as number }));

    if (values.length < 5) continue;

    // Sort: best first
    values.sort((a, b) => lowerIsBetter ? a.value - b.value : b.value - a.value);

    for (let i = 0; i < values.length; i++) {
      const percentile = Math.round(((values.length - i) / values.length) * 100);
      const existing = percentiles.get(values[i].id) || {};
      existing[key as string] = percentile;
      percentiles.set(values[i].id, existing);
    }
  }

  return percentiles;
}

/**
 * Map course DNA importance fields to player stat keys.
 * Uses derived proxies when direct SG data isn't available.
 */
const STAT_MAPPING: Array<{
  dnaField: keyof CourseDNAProfile;
  statKey: string;
  fallbackKey?: string;  // Use proxy if primary not available
  displayName: string;
}> = [
  { dnaField: 'drivingDistanceImportance', statKey: 'driveAvg', displayName: 'Driving Distance' },
  { dnaField: 'drivingAccuracyImportance', statKey: 'driveAcc', displayName: 'Driving Accuracy' },
  { dnaField: 'girImportance', statKey: 'girPct', displayName: 'Greens in Regulation' },
  { dnaField: 'scramblingImportance', statKey: 'scramblingPct', displayName: 'Scrambling' },
  { dnaField: 'puttingImportance', statKey: 'puttAvg', fallbackKey: 'sgPuttingProxy', displayName: 'Putting' },
  { dnaField: 'sgOffTeeImportance', statKey: 'sgOffTeeProxy', fallbackKey: 'driveAvg', displayName: 'SG: Off the Tee' },
  { dnaField: 'sgApproachImportance', statKey: 'sgApproachProxy', fallbackKey: 'holeProximityAvg', displayName: 'SG: Approach' },
  { dnaField: 'sgAroundGreenImportance', statKey: 'sgAroundGreenProxy', fallbackKey: 'scramblingPct', displayName: 'SG: Around Green' },
  { dnaField: 'sgPuttingImportance', statKey: 'sgPuttingProxy', fallbackKey: 'puttAvg', displayName: 'SG: Putting' },
];

/**
 * Calculate course fit scores for all players in the field.
 */
export function calculateCourseFitScores(
  courseDNA: CourseDNAProfile,
  players: PlayerStats[],
): Map<string, CourseFitResult> {
  
  const percentiles = calculateFieldPercentiles(players);
  const results = new Map<string, CourseFitResult>();

  for (const player of players) {
    const playerPercentiles = percentiles.get(player.playerId);
    if (!playerPercentiles) continue;

    const breakdown: FitBreakdownItem[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const { dnaField, statKey, fallbackKey, displayName } of STAT_MAPPING) {
      const importance = (courseDNA as any)[dnaField] as number;
      if (importance === undefined || importance === null || importance === 0) continue;

      // Try primary stat key, then fallback
      let percentile = playerPercentiles[statKey];
      if (percentile === undefined && fallbackKey) {
        percentile = playerPercentiles[fallbackKey];
      }
      if (percentile === undefined) continue;

      const contribution = (importance * percentile) / 100;
      totalWeightedScore += contribution;
      totalWeight += importance;

      breakdown.push({
        statName: displayName,
        importance,
        playerPercentile: percentile,
        contribution,
      });
    }

    // Also factor in overall quality signals with lower weight
    const qualityStats: Array<{ key: string; weight: number; displayName: string }> = [
      { key: 'sgTotal', weight: 30, displayName: 'Overall SG' },
      { key: 'birdiesPerRound', weight: 15, displayName: 'Birdie Making' },
      { key: 'scoringAvg', weight: 15, displayName: 'Scoring Average' },
    ];

    for (const { key, weight, displayName } of qualityStats) {
      const percentile = playerPercentiles[key];
      if (percentile === undefined) continue;

      const contribution = (weight * percentile) / 100;
      totalWeightedScore += contribution;
      totalWeight += weight;

      breakdown.push({
        statName: displayName,
        importance: weight,
        playerPercentile: percentile,
        contribution,
      });
    }

    const fitScore = totalWeight > 0
      ? Math.round((totalWeightedScore / totalWeight) * 100) / 100
      : 50;

    breakdown.sort((a, b) => b.contribution - a.contribution);

    const strengths = breakdown
      .filter((b) => b.importance >= 40 && b.playerPercentile >= 70)
      .slice(0, 3)
      .map((b) => b.statName);

    const weaknesses = breakdown
      .filter((b) => b.importance >= 40 && b.playerPercentile <= 30)
      .slice(0, 2)
      .map((b) => b.statName);

    results.set(player.playerId, {
      playerId: player.playerId,
      playerName: player.playerName,
      fitScore: Math.round(fitScore),
      fitBreakdown: breakdown,
      strengths,
      weaknesses,
    });
  }

  return results;
}

/**
 * Format course fit data for AI prompt injection.
 */
export function formatCourseFitForPrompt(
  fitScores: Map<string, CourseFitResult>,
  playerIds: string[],
  limit = 30,
): string {
  const sorted = playerIds
    .map((id) => fitScores.get(id))
    .filter((f): f is CourseFitResult => f !== undefined)
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, limit);

  return sorted.map((f) => {
    const strengthStr = f.strengths.length > 0 ? `Strengths: ${f.strengths.join(', ')}` : '';
    const weakStr = f.weaknesses.length > 0 ? `Weaknesses: ${f.weaknesses.join(', ')}` : '';
    return `${f.playerName}: courseFit=${f.fitScore}/100. ${strengthStr}${weakStr ? '. ' + weakStr : ''}`;
  }).join('\n');
}
