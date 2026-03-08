/**
 * Priority 5: Player Statistics Extraction (Adapted to Available Data)
 * 
 * Sportradar Golf v3 provides these stats in sr_player_statistics.raw_data:
 * 
 * AVAILABLE:
 * - strokes_gained_total ✅
 * - strokes_gained_tee_green ✅
 * - drive_avg (driving distance) ✅
 * - drive_acc (driving accuracy %) ✅
 * - gir_pct (greens in regulation %) ✅
 * - scrambling_pct ✅
 * - putt_avg (putts per round) ✅
 * - hole_proximity_avg (approach proximity in feet) ✅
 * - birdies_per_round ✅
 * - scoring_avg ✅
 * 
 * NOT AVAILABLE (Sportradar doesn't provide detailed SG breakdown):
 * - sg_off_tee ❌
 * - sg_approach ❌
 * - sg_around_green ❌
 * - sg_putting ❌
 * 
 * We derive approximate SG breakdown from available stats:
 * - SG: Putting ≈ derived from putt_avg relative to field average
 * - SG: Approach ≈ derived from hole_proximity_avg and GIR
 * - SG: Off the Tee ≈ sg_tee_green minus approach proxy
 * - SG: Around Green ≈ derived from scrambling_pct relative to field
 */

export interface PlayerStats {
  playerId: string;
  playerName: string;
  
  // Core stats (directly from Sportradar)
  driveAvg: number | null;        // Driving distance (yards)
  driveAcc: number | null;        // Driving accuracy (%)
  girPct: number | null;          // Greens in regulation (%)
  scramblingPct: number | null;   // Scrambling (%)
  puttAvg: number | null;         // Putts per round
  sgTotal: number | null;         // Strokes gained: total
  sgTeeToGreen: number | null;    // Strokes gained: tee to green
  holeProximityAvg: number | null; // Approach proximity (feet)
  birdiesPerRound: number | null; // Birdies per round
  scoringAvg: number | null;      // Scoring average
  
  // Derived proxies (calculated from available data)
  sgPuttingProxy: number | null;      // Estimated SG: Putting
  sgApproachProxy: number | null;     // Estimated SG: Approach
  sgOffTeeProxy: number | null;       // Estimated SG: Off the Tee
  sgAroundGreenProxy: number | null;  // Estimated SG: Around Green
  
  // Rankings
  worldRank: number | null;
  priorRank: number | null;
  rankMomentum: number | null;  // prior - current (positive = improving)
  
  // Form
  recentResults: Array<{ tournament: string; position: number; score: number }>;
  
  // Course history
  venueHistory: Array<{ year: number; position: number; score: number }>;
}

/**
 * Extract stats from sr_player_statistics.raw_data.
 * Handles the nested Sportradar statistics object format.
 */
export function extractPlayerStats(rawData: any): {
  driveAvg: number | null;
  driveAcc: number | null;
  girPct: number | null;
  scramblingPct: number | null;
  puttAvg: number | null;
  sgTotal: number | null;
  sgTeeToGreen: number | null;
  holeProximityAvg: number | null;
  birdiesPerRound: number | null;
  scoringAvg: number | null;
} {
  const stats = rawData?.statistics || rawData || {};
  
  const parseStatAvg = (field: any): number | null => {
    if (field === null || field === undefined) return null;
    if (typeof field === 'number') return field;
    if (typeof field === 'object' && field.avg !== undefined) return parseFloat(field.avg) || null;
    if (typeof field === 'string') return parseFloat(field) || null;
    return null;
  };

  return {
    driveAvg: parseStatAvg(stats.drive_avg),
    driveAcc: parseStatAvg(stats.drive_acc),
    girPct: parseStatAvg(stats.gir_pct),
    scramblingPct: parseStatAvg(stats.scrambling_pct),
    puttAvg: parseStatAvg(stats.putt_avg),
    sgTotal: parseStatAvg(stats.strokes_gained_total),
    sgTeeToGreen: parseStatAvg(stats.strokes_gained_tee_green),
    holeProximityAvg: parseStatAvg(stats.hole_proximity_avg),
    birdiesPerRound: parseStatAvg(stats.birdies_per_round),
    scoringAvg: parseStatAvg(stats.scoring_avg),
  };
}

/**
 * Derive approximate SG component proxies from available stats.
 * These are estimates, not exact — but better than nothing for course fit matching.
 * 
 * Called AFTER all players' stats are extracted, so we can calculate field averages.
 * 
 * @param players - Array of players with extracted stats
 * @returns Same array with sgPuttingProxy, sgApproachProxy, sgOffTeeProxy, sgAroundGreenProxy filled in
 */
export function deriveSGProxies(players: PlayerStats[]): PlayerStats[] {
  // Calculate field averages for proxy derivation
  const validPutting = players.filter((p) => p.puttAvg !== null);
  const avgPutting = validPutting.length > 0
    ? validPutting.reduce((sum, p) => sum + p.puttAvg!, 0) / validPutting.length
    : 29.0; // Tour average ~29 putts/round
  
  const validProximity = players.filter((p) => p.holeProximityAvg !== null);
  const avgProximity = validProximity.length > 0
    ? validProximity.reduce((sum, p) => sum + p.holeProximityAvg!, 0) / validProximity.length
    : 35.0; // Tour average ~35 feet
    
  const validScrambling = players.filter((p) => p.scramblingPct !== null);
  const avgScrambling = validScrambling.length > 0
    ? validScrambling.reduce((sum, p) => sum + p.scramblingPct!, 0) / validScrambling.length
    : 58.0; // Tour average ~58%

  return players.map((player) => {
    // SG: Putting proxy — based on putts per round vs field average
    // Lower putts = better, so negate the difference
    const sgPuttingProxy = player.puttAvg !== null
      ? -((player.puttAvg - avgPutting) * 0.8) // Scale factor for approximate SG
      : null;

    // SG: Approach proxy — based on hole proximity
    // Lower proximity = better approach play
    const sgApproachProxy = player.holeProximityAvg !== null
      ? -((player.holeProximityAvg - avgProximity) / avgProximity) * 1.5
      : null;

    // SG: Around Green proxy — based on scrambling %
    // Higher scrambling = better short game
    const sgAroundGreenProxy = player.scramblingPct !== null
      ? ((player.scramblingPct - avgScrambling) / avgScrambling) * 1.2
      : null;

    // SG: Off the Tee proxy — if we have SG tee-to-green and approach proxy,
    // OTT ≈ tee-to-green minus approach
    const sgOffTeeProxy = (player.sgTeeToGreen !== null && sgApproachProxy !== null)
      ? player.sgTeeToGreen - sgApproachProxy
      : null;

    return {
      ...player,
      sgPuttingProxy,
      sgApproachProxy,
      sgOffTeeProxy,
      sgAroundGreenProxy,
    };
  });
}

/**
 * Format player stats for inclusion in AI prompts.
 * Includes both raw stats and derived proxies.
 */
export function formatStatsForPrompt(player: PlayerStats): string {
  const lines: string[] = [];
  
  if (player.driveAvg !== null) lines.push(`Drive: ${player.driveAvg}yds`);
  if (player.driveAcc !== null) lines.push(`Acc: ${player.driveAcc}%`);
  if (player.girPct !== null) lines.push(`GIR: ${player.girPct}%`);
  if (player.scramblingPct !== null) lines.push(`Scramble: ${player.scramblingPct}%`);
  if (player.puttAvg !== null) lines.push(`Putts: ${player.puttAvg}`);
  if (player.holeProximityAvg !== null) lines.push(`Proximity: ${player.holeProximityAvg}ft`);
  if (player.birdiesPerRound !== null) lines.push(`Birdies/Rd: ${player.birdiesPerRound}`);
  if (player.scoringAvg !== null) lines.push(`ScoringAvg: ${player.scoringAvg}`);
  
  if (player.sgTotal !== null) lines.push(`SG Total: ${player.sgTotal.toFixed(2)}`);
  if (player.sgTeeToGreen !== null) lines.push(`SG T2G: ${player.sgTeeToGreen.toFixed(2)}`);
  
  // Include derived proxies with a note they're estimated
  const proxies: string[] = [];
  if (player.sgPuttingProxy !== null) proxies.push(`Putt: ${player.sgPuttingProxy.toFixed(2)}`);
  if (player.sgApproachProxy !== null) proxies.push(`App: ${player.sgApproachProxy.toFixed(2)}`);
  if (player.sgOffTeeProxy !== null) proxies.push(`OTT: ${player.sgOffTeeProxy.toFixed(2)}`);
  if (player.sgAroundGreenProxy !== null) proxies.push(`ARG: ${player.sgAroundGreenProxy.toFixed(2)}`);
  
  if (proxies.length > 0) {
    lines.push(`SG Est: ${proxies.join(', ')}`);
  }
  
  if (player.worldRank) {
    const momentum = player.rankMomentum
      ? ` (${player.rankMomentum > 0 ? '↑' : '↓'}${Math.abs(player.rankMomentum)})`
      : '';
    lines.push(`Rank: #${player.worldRank}${momentum}`);
  }
  
  return lines.join(' | ');
}
