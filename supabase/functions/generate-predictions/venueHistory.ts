/**
 * Priority 6: Historical Venue Performance Scoring
 * 
 * Calculates a numerical venue history score for each player,
 * replacing text-only context with structured data.
 * 
 * Used in the prediction pipeline to give Claude/GPT concrete
 * numbers alongside the narrative context.
 */

export interface VenueHistoryScore {
  playerId: string;
  playerName: string;
  venueScore: number;        // 0-100 composite score
  tournaments: number;       // Number of times played at venue
  wins: number;
  top5s: number;
  top10s: number;
  top20s: number;
  cutsMade: number;
  cutsMissed: number;
  bestFinish: number | null;
  avgFinish: number | null;
  avgScore: number | null;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient';
  results: Array<{
    year: number;
    position: number;
    score: number;
  }>;
}

/**
 * Calculate venue history scores for a list of players.
 * 
 * @param venueResults - Historical leaderboard results at this venue
 *   Format: { player_id, position, score, year, status }[]
 * @param playerNames - Map of player_id → player name
 */
export function calculateVenueHistoryScores(
  venueResults: Array<{
    player_id: string;
    position: number | null;
    score: number | null;
    year: number;
    status: string | null;
  }>,
  playerNames: Map<string, string>,
): Map<string, VenueHistoryScore> {
  
  // Group by player
  const playerResults = new Map<string, typeof venueResults>();
  for (const result of venueResults) {
    const existing = playerResults.get(result.player_id) || [];
    existing.push(result);
    playerResults.set(result.player_id, existing);
  }

  const scores = new Map<string, VenueHistoryScore>();

  for (const [playerId, results] of playerResults) {
    const finished = results.filter((r) => r.position !== null && r.status !== 'cut');
    const missed = results.filter((r) => r.status === 'cut' || r.status === 'wd');
    
    const wins = finished.filter((r) => r.position === 1).length;
    const top5s = finished.filter((r) => r.position! <= 5).length;
    const top10s = finished.filter((r) => r.position! <= 10).length;
    const top20s = finished.filter((r) => r.position! <= 20).length;
    
    const positions = finished.map((r) => r.position!);
    const avgFinish = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : null;
    
    const scoresArr = finished.filter((r) => r.score !== null).map((r) => r.score!);
    const avgScore = scoresArr.length > 0
      ? scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length
      : null;
    
    const bestFinish = positions.length > 0 ? Math.min(...positions) : null;

    // Calculate trend from most recent 3 results
    const sorted = finished.sort((a, b) => b.year - a.year);
    let trend: VenueHistoryScore['trend'] = 'insufficient';
    if (sorted.length >= 3) {
      const recent = sorted.slice(0, 3).map((r) => r.position!);
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
      const older = sorted.slice(1).map((r) => r.position!);
      const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
      
      if (avgRecent < avgOlder - 5) trend = 'improving';
      else if (avgRecent > avgOlder + 5) trend = 'declining';
      else trend = 'stable';
    } else if (sorted.length >= 2) {
      trend = 'stable';
    }

    // Composite venue score (0-100)
    let venueScore = 30; // Base score for having played here
    
    venueScore += wins * 25;           // Won here: huge bonus
    venueScore += top5s * 8;           // Top 5 finishes
    venueScore += top10s * 4;          // Top 10 finishes  
    venueScore += top20s * 2;          // Top 20 finishes
    
    // Consistency bonus: cuts made ratio
    const totalEvents = finished.length + missed.length;
    if (totalEvents > 0) {
      const cutRate = finished.length / totalEvents;
      venueScore += cutRate * 10;
    }
    
    // Average finish bonus (lower avg = higher score)
    if (avgFinish !== null && avgFinish < 30) {
      venueScore += Math.max(0, (30 - avgFinish) / 30 * 15);
    }
    
    // Penalty for missed cuts
    venueScore -= missed.length * 5;
    
    // First-timer penalty
    if (totalEvents === 0) {
      venueScore = 20; // Neutral — no history
    }
    
    // Clamp to 0-100
    venueScore = Math.max(0, Math.min(100, Math.round(venueScore)));

    scores.set(playerId, {
      playerId,
      playerName: playerNames.get(playerId) || 'Unknown',
      venueScore,
      tournaments: totalEvents,
      wins,
      top5s,
      top10s,
      top20s,
      cutsMade: finished.length,
      cutsMissed: missed.length,
      bestFinish,
      avgFinish: avgFinish ? Math.round(avgFinish * 10) / 10 : null,
      avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
      trend,
      results: sorted.map((r) => ({
        year: r.year,
        position: r.position!,
        score: r.score || 0,
      })),
    });
  }

  return scores;
}

/**
 * Format venue history for AI prompt injection.
 * Returns structured text for top performers at this venue.
 */
export function formatVenueHistoryForPrompt(
  scores: Map<string, VenueHistoryScore>,
  fieldPlayerIds: string[],
  limit = 30,
): string {
  const fieldScores = fieldPlayerIds
    .map((id) => scores.get(id))
    .filter((s): s is VenueHistoryScore => s !== undefined && s.tournaments > 0)
    .sort((a, b) => b.venueScore - a.venueScore)
    .slice(0, limit);

  if (fieldScores.length === 0) return 'No venue history data available.';

  const lines = fieldScores.map((s) => {
    const history = s.results.slice(0, 3).map((r) => `${r.year}: T${r.position} (${r.score})`).join(', ');
    return `${s.playerName}: venueScore=${s.venueScore}, ${s.tournaments} events, ` +
      `${s.wins}W/${s.top5s}T5/${s.top10s}T10, best: ${s.bestFinish || '—'}, ` +
      `avg: ${s.avgFinish || '—'}, trend: ${s.trend}. History: ${history}`;
  });

  return lines.join('\n');
}
