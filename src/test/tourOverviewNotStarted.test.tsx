/* FIX — TOUR OVERVIEW: "THE SITUATION" BEFORE ANYONE HAS TEED OFF. */
import { describe, expect, it } from 'vitest';
import en from '../../public/locales/en/tourhub.json';
import { tournamentHeadlineSegments } from '@/features/tourhub/overview/magazineCopy';
import { earliestTeeTime, fieldHasStarted, rowHasStarted } from '@/features/tourhub/overview/boardStarted';
import { formatTimeHm } from '@/i18n/format';

const keys: string[] = [];
const t = ((key: string, values?: Record<string, unknown>) => {
  keys.push(key);
  const resolved = key.split('.').reduce<unknown>((n, p) => (n && typeof n === 'object' ? (n as Record<string, unknown>)[p] : undefined), en);
  let v = typeof resolved === 'string' ? resolved : key;
  for (const [k, r] of Object.entries(values ?? {})) v = v.split(`{{${k}}}`).join(String(r));
  return v;
}) as any;
const tournament = { id: '1', name: 'Mexico Open', defendingChampion: null } as any;
const live = (round: number) => ({ kind: 'live', round, totalRounds: 4 }) as any;
const idle = (i: number) => ({ score: 0, position: 1, player: { full_name: `Player ${i}` } });
const field = Array.from({ length: 121 }, (_, i) => idle(i));
const lastKey = () => keys[keys.length - 1];

describe('has-started rule', () => {
  it('a 0 score with no round score and no thru has not started', () => {
    expect(rowHasStarted({ score: 0 } as any)).toBe(false);
    expect(rowHasStarted({ thru: 0 })).toBe(false);
    expect(rowHasStarted({ thru: 1 })).toBe(true);
    expect(rowHasStarted({ round_1: 0 })).toBe(true);
    expect(fieldHasStarted(field as any)).toBe(false);
  });
  it('earliest tee time is the minimum', () => {
    expect(earliestTeeTime([{ teeTime: '2026-10-29T14:10:00Z' }, { teeTime: '2026-10-29T13:00:00Z' }])).toBe('2026-10-29T13:00:00Z');
    expect(earliestTeeTime([])).toBeNull();
  });
});

describe('live situation before anyone tees off', () => {
  it('121 idle rows with a tee time give liveNotStartedTime, time as the figure', () => {
    const tee = '2026-10-29T13:00:00Z';
    const segs = tournamentHeadlineSegments({ tournament, state: live(1), leaderboard: field, t, firstTeeTime: tee });
    expect(lastKey()).toBe('overview.magazine.liveNotStartedTime');
    expect(segs.find((s) => s.figure)?.text).toBe(formatTimeHm(tee));
  });
  it('without a tee time gives liveNotStarted', () => {
    tournamentHeadlineSegments({ tournament, state: live(1), leaderboard: field, t });
    expect(lastKey()).toBe('overview.magazine.liveNotStarted');
  });
  it('one started row at -1 among 120 idle names that single leader', () => {
    const rows = [...field.slice(0, 120), { score: -1, thru: 2, position: 1, player: { full_name: 'Solo Leader' } }];
    const text = tournamentHeadlineSegments({ tournament, state: live(1), leaderboard: rows, t }).map((s) => s.text).join('');
    expect(lastKey()).toBe('overview.magazine.liveLeaderScore');
    expect(text).toContain('Leader');
  });
  it('round 2 before anyone tees off still names the round-1 leader', () => {
    const rows = [
      { score: -6, round_1: -6, thru: null, player: { full_name: 'First Leader' } },
      { score: -4, round_1: -4, thru: null, player: { full_name: 'Second Man' } },
    ];
    const text = tournamentHeadlineSegments({ tournament, state: live(2), leaderboard: rows, t }).map((s) => s.text).join('');
    expect(lastKey()).toBe('overview.magazine.liveMarginScore');
    expect(text).toContain('Leader');
  });
});
