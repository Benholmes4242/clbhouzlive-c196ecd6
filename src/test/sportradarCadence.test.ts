import { describe, expect, it, vi } from 'vitest';
import {
  shouldFetchLeaderboard, shouldFetchScorecards, shouldFetchHoleStats,
  shouldFetchInPlayTeeTimes, shouldResolveStatus, shouldFetchPreEventTeeTimes,
  nextTeeTimesRound,
} from '../../supabase/functions/_shared/sportradarCadence';
import { logSportradarCall } from '../../supabase/functions/_shared/sportradarCallLog';

const minutes = Array.from({ length: 60 }, (_, minute) =>
  new Date(Date.UTC(2026, 9, 19, 12, minute)));

describe('Sportradar quota-fit cadence', () => {
  it.each([
    ['leaderboard', shouldFetchLeaderboard, 5, 0, 12],
    ['scorecards', shouldFetchScorecards, 15, 2, 4],
    ['hole stats', shouldFetchHoleStats, 30, 7, 2],
    ['in-play tee times', shouldFetchInPlayTeeTimes, 30, 12, 2],
    ['status resolver', shouldResolveStatus, 5, 3, 12],
  ] as const)('%s uses the exact offset and hourly count', (_name, gate, interval, offset, count) => {
    expect(minutes.filter(gate)).toHaveLength(count);
    for (let minute = 0; minute < 60; minute++) {
      expect(gate(minutes[minute])).toBe(minute % interval === offset);
    }
  });

  it('never overlaps the four routine data gates in a full hour', () => {
    for (const minute of minutes) {
      const hits = [shouldFetchLeaderboard, shouldFetchScorecards,
        shouldFetchHoleStats, shouldFetchInPlayTeeTimes].filter(gate => gate(minute));
      expect(hits.length).toBeLessThanOrEqual(1);
    }
  });

  it('pre-event tee times run exactly eight times across all 1,440 UTC minutes', () => {
    const hits: string[] = [];
    for (let minute = 0; minute < 24 * 60; minute++) {
      const date = new Date(Date.UTC(2026, 9, 19, 0, minute));
      const expected = date.getUTCMinutes() === 0 && date.getUTCHours() % 3 === 0;
      expect(shouldFetchPreEventTeeTimes(date)).toBe(expected);
      if (shouldFetchPreEventTeeTimes(date)) hits.push(date.toISOString().slice(11, 16));
    }
    expect(hits).toEqual(['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']);
  });

  it('round two requests only round three', () => {
    expect(nextTeeTimesRound(2)).toBe(3);
  });

  it('round four has no next-round tee-times fetch', () => {
    expect(nextTeeTimesRound(4)).toBeNull();
  });
});

describe('Sportradar actual-call identity', () => {
  it.each([
    ['https://api.sportradar.com/golf/production/pga/v3/en/2026/tournaments/event-id/rounds/03/teetimes.json?api_key=not-a-real-key', 'TeeTimes R3', '[SR_CALL] TeeTimes R3 pga event-id'],
    ['https://api.sportradar.com/golf/production/euro/v3/en/2026/tournaments/schedule.json', 'Schedule', '[SR_CALL] Schedule euro -'],
    ['https://api.sportradar.com/golf/production/v3/en/players/wgr/2026/rankings.json', 'World Rankings', '[SR_CALL] World Rankings - -'],
  ])('logs endpoint identity without query data: %s', (url, label, expected) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      logSportradarCall(url, label);
      expect(log).toHaveBeenCalledExactlyOnceWith(expected);
    } finally {
      log.mockRestore();
    }
  });
});