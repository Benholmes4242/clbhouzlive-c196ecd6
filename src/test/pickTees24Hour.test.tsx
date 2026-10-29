/* BRIEF — PICK TEE TIMES: 24-HOUR CLOCK AND THE HEADING FALLBACK. */
import { describe, expect, it } from 'vitest';
import en from '../../public/locales/en/tourhub.json';
import { tournamentHeadlineSegments } from '@/features/tourhub/overview/magazineCopy';
import { formatMonthDayHm24, formatTimeHm, formatTimeHm24 } from '@/i18n/format';
import { teeHeadingFits } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';

const t = ((key: string, values?: Record<string, unknown>) => {
  const resolved = key.split('.').reduce<unknown>((n, p) => (n && typeof n === 'object' ? (n as Record<string, unknown>)[p] : undefined), en);
  let v = typeof resolved === 'string' ? resolved : key;
  for (const [k, r] of Object.entries(values ?? {})) v = v.split(`{{${k}}}`).join(String(r));
  return v;
}) as any;
const local = (h: number, m: number) => new Date(2026, 9, 29, h, m, 0);

describe('formatTimeHm24', () => {
  it('pads hours and minutes', () => {
    expect(formatTimeHm24(local(8, 51))).toBe('08:51');
    expect(formatTimeHm24(local(14, 5))).toBe('14:05');
    expect(formatTimeHm24(local(0, 10))).toBe('00:10');
  });
  it('formatMonthDayHm24 output is unchanged', () => {
    const d = local(14, 5);
    const md = new Intl.DateTimeFormat('en-GB-u-hc-h12', { month: 'short', day: 'numeric' }).format(d);
    expect(formatMonthDayHm24(d)).toBe(`${md}, 14:05`);
  });
  it('the situation line still uses the 12-hour formatTimeHm', () => {
    const tee = local(14, 5).toISOString();
    const field = Array.from({ length: 3 }, (_, i) => ({ score: 0, position: 1, player: { full_name: `P${i}` } }));
    const segs = tournamentHeadlineSegments({ tournament: { id: '1', name: 'E', defendingChampion: null } as any, state: { kind: 'live', round: 1, totalRounds: 4 } as any, leaderboard: field as any, t, firstTeeTime: tee });
    const fig = segs.find((s) => s.figure)?.text;
    expect(fig).toBe(formatTimeHm(tee));
    expect(fig).not.toBe('14:05');
  });
});

describe('teeHeadingFits', () => {
  it('fits when picks + gap + label fit the content box', () => {
    expect(teeHeadingFits(335, 145, 129)).toBe(true);
    expect(teeHeadingFits(280, 145, 129)).toBe(false);
  });
});
