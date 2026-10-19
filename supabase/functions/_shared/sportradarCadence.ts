/** Quota-fit cadence ownership: tournament-live-sync alone consumes these UTC
 * gates; housekeeping, local round writes and final reconciliation are ungated.
 * Keep independent offsets here so routine data requests never share a minute.
 */
export const LEADERBOARD_EVERY_MIN = 5;
export const LEADERBOARD_OFFSET_MIN = 0;
export const SCORECARDS_EVERY_MIN = 15;
export const SCORECARDS_OFFSET_MIN = 2;
export const HOLE_STATS_EVERY_MIN = 30;
export const HOLE_STATS_OFFSET_MIN = 7;
export const INPLAY_TEE_TIMES_EVERY_MIN = 30;
export const INPLAY_TEE_TIMES_OFFSET_MIN = 12;
export const STATUS_RESOLVER_EVERY_MIN = 5;
export const STATUS_RESOLVER_OFFSET_MIN = 3;
export const PRE_EVENT_TEE_TIMES_EVERY_HOURS = 3;
export const PRE_EVENT_TEE_TIMES_MINUTE = 0;

export const shouldFetchLeaderboard = (now: Date): boolean =>
  now.getUTCMinutes() % LEADERBOARD_EVERY_MIN === LEADERBOARD_OFFSET_MIN;
export const shouldFetchScorecards = (now: Date): boolean =>
  now.getUTCMinutes() % SCORECARDS_EVERY_MIN === SCORECARDS_OFFSET_MIN;
export const shouldFetchHoleStats = (now: Date): boolean =>
  now.getUTCMinutes() % HOLE_STATS_EVERY_MIN === HOLE_STATS_OFFSET_MIN;
export const shouldFetchInPlayTeeTimes = (now: Date): boolean =>
  now.getUTCMinutes() % INPLAY_TEE_TIMES_EVERY_MIN === INPLAY_TEE_TIMES_OFFSET_MIN;
export const shouldResolveStatus = (now: Date): boolean =>
  now.getUTCMinutes() % STATUS_RESOLVER_EVERY_MIN === STATUS_RESOLVER_OFFSET_MIN;
export const shouldFetchPreEventTeeTimes = (now: Date): boolean =>
  now.getUTCMinutes() === PRE_EVENT_TEE_TIMES_MINUTE &&
  now.getUTCHours() % PRE_EVENT_TEE_TIMES_EVERY_HOURS === 0;

export function nextTeeTimesRound(activeRound: number): number | null {
  return activeRound + 1 > 4 ? null : activeRound + 1;
}