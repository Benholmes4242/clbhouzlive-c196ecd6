import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELAY_AFTER_MINUTES, isRoundDelayed, roundHasStarter } from '@/features/tourhub/overview/roundDelay';
import { readAlsoWeekData } from '@/features/tourhub/overview/sections/useAlsoWeekData';

const f = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: f.from } }));
afterEach(() => vi.clearAllMocks());

const firstTee = '2026-11-21T14:10:00Z';
const input = { status: 'inprogress', currentRound: 3, currentRoundStatus: 'scheduled', firstTee, started: false, now: new Date('2026-11-21T15:11:00Z') };

describe('shared scheduled-round delay rule', () => {
  it.each(['scheduled', null])('true at first tee plus 61 minutes with round status %s and no starters', currentRoundStatus => {
    expect(isRoundDelayed({ ...input, currentRoundStatus })).toBe(true);
  });
  it('false at first tee plus 59 minutes', () => {
    expect(isRoundDelayed({ ...input, now: new Date('2026-11-21T15:09:00Z') })).toBe(false);
  });
  it('60 minutes is the boundary and must be exceeded', () => {
    expect(DELAY_AFTER_MINUTES).toBe(60);
    expect(isRoundDelayed({ ...input, now: new Date('2026-11-21T15:10:00Z') })).toBe(false);
  });
  it('false once any player has a current-round starter', () => {
    expect(isRoundDelayed({ ...input, started: true })).toBe(false);
  });
  it.each(['inprogress', 'in_progress', 'suspended', 'delayed', 'weather', 'holdup', 'complete', 'closed'])('false when current round status is %s', currentRoundStatus => {
    expect(isRoundDelayed({ ...input, currentRoundStatus })).toBe(false);
  });
  it.each([null, undefined, 'invalid'])('false with missing or invalid first tee %s', tee => {
    expect(isRoundDelayed({ ...input, firstTee: tee })).toBe(false);
  });
  it('false when republished first tees move back into the future', () => {
    expect(isRoundDelayed({ ...input, firstTee: '2026-11-21T22:00:00Z', now: new Date('2026-11-21T21:47:00Z') })).toBe(false);
  });
  it.each(['scheduled', 'created', 'closed', 'complete', 'suspended', 'cancelled'])('false when event status is %s rather than in progress', status => {
    expect(isRoundDelayed({ ...input, status })).toBe(false);
  });
  it('uses the existing in_progress event-status alias', () => {
    expect(isRoundDelayed({ ...input, status: 'in_progress' })).toBe(true);
  });
  it('does not derive a delay without a valid current round', () => {
    expect(isRoundDelayed({ ...input, currentRound: null })).toBe(false);
    expect(isRoundDelayed({ ...input, currentRound: 0 })).toBe(false);
  });
  it('matches today_round exactly and requires thru greater than zero', () => {
    expect(roundHasStarter([{ today_round: 2, thru: 18 }, { today_round: 3, thru: 0 }], 3)).toBe(false);
    expect(roundHasStarter([{ today_round: 2, thru: 18 }, { today_round: 3, thru: 1 }], 3)).toBe(true);
    expect(roundHasStarter([{ today_round: null, thru: 18 }], 3)).toBe(false);
  });
});

function setupTees(data: Array<{ tournament_id: string; round_number: number; tee_time: string }>, error: { message: string } | null = null) {
  const chain = {
    select: vi.fn(), in: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve),
  };
  for (const method of ['select', 'in', 'eq', 'order', 'limit'] as const) chain[method].mockReturnValue(chain);
  const board = { ...chain, select: vi.fn(), in: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve) };
  for (const method of ['select', 'in', 'eq', 'order', 'limit'] as const) board[method].mockReturnValue(board);
  f.from.mockImplementation((table: string) => table === 'sr_tee_times' ? chain : board);
  return chain;
}

describe('batched weekly current-round tees', () => {
  it('one batched tee query selects earliest valid times by exact tournament and round', async () => {
    const chain = setupTees([
      { tournament_id: 'a', round_number: 3, tee_time: '2026-11-21T15:00:00Z' },
      { tournament_id: 'a', round_number: 3, tee_time: firstTee },
      { tournament_id: 'a', round_number: 3, tee_time: 'invalid' },
      { tournament_id: 'a', round_number: 2, tee_time: '2026-11-20T08:00:00Z' },
      { tournament_id: 'b', round_number: 2, tee_time: '2026-11-21T09:00:00Z' },
      { tournament_id: 'b', round_number: 3, tee_time: '2026-11-21T07:00:00Z' },
    ]);
    const result = await readAlsoWeekData(['a', 'b'], [], [{ tournamentId: 'a', round: 3 }, { tournamentId: 'b', round: 2 }]);
    expect(f.from.mock.calls).toEqual([['sr_leaderboards'], ['sr_tee_times']]);
    expect(chain.select).toHaveBeenCalledWith('tournament_id,round_number,tee_time');
    expect(chain.in).toHaveBeenCalledWith('tournament_id', ['a', 'b']);
    expect(chain.in).toHaveBeenCalledWith('round_number', [3, 2]);
    expect(result.firstTees.get('a')?.get(3)).toBe(firstTee);
    expect(result.firstTees.get('a')?.has(2)).toBe(false);
    expect(result.firstTees.get('b')?.get(2)).toBe('2026-11-21T09:00:00Z');
    expect(result.firstTees.get('b')?.has(3)).toBe(false);
  });
  it('without in-progress current rounds there is no extra tee query', async () => {
    setupTees([]);
    const result = await readAlsoWeekData(['a'], []);
    expect(f.from.mock.calls).toEqual([['sr_leaderboards']]);
    expect(result.firstTees.size).toBe(0);
  });
  it('a failed current-tee batch cannot supply a delayed first tee', async () => {
    setupTees([], { message: 'tee read failed' });
    await expect(readAlsoWeekData(['a'], [], [{ tournamentId: 'a', round: 3 }])).rejects.toEqual({ message: 'tee read failed' });
  });
});