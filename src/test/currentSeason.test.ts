import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chainable supabase stub: records filters, answers from ROWS by end_date direction.
let ROWS: any[] = [];
let GATES: unknown[] = [];
vi.mock('@/integrations/supabase/client', () => {
  const from = () => {
    const f: { gte?: string; lt?: string; types?: string[] } = {};
    const b: any = {
      select: () => b, ilike: () => b, or: () => b, order: () => b, eq: () => b,
      in: (column: string, types: string[]) => { GATES.push([column, types]); f.types = types; return b; },
      gte: (_c: string, v: string) => { f.gte = v; return b; },
      lt: (_c: string, v: string) => { f.lt = v; return b; },
      limit: () => {
        let d = ROWS.filter((r) => (!f.types || f.types.includes(r.event_type)) && (f.gte ? r.end_date >= f.gte : true) && (f.lt ? r.end_date < f.lt : true));
        d = f.gte ? d.sort((a, z) => a.start_date.localeCompare(z.start_date)) : d.sort((a, z) => z.end_date.localeCompare(a.end_date));
        return Promise.resolve({ data: d.slice(0, 5), error: null });
      },
    };
    return b;
  };
  return { supabase: { from } };
});

import { pickCurrentSeason, currentSeasonFor } from '@/features/tourhub/_shared/currentSeason';
import { getPgaSeasonId } from '@/features/tourhub/hooks/useAIPredictions';
import { currentFirst } from '@/features/tourhub/schedule-v2/useSeasonTimeline';

const S26 = { id: 'pga-2026', year: 2026 };
const S27 = { id: 'pga-2027', year: 2027 };
const ev = (start: string, end: string, season: any, status = 'scheduled', event_type = 'stroke') => ({ start_date: start, end_date: end, status, event_type, season });
const PGA = [
  ev('2026-11-05', '2026-11-08', S26, 'closed'),
  ev('2026-11-12', '2026-11-15', S26), // Austin
  ev('2026-11-19', '2026-11-22', S26), // RSM
  ev('2027-01-21', '2027-01-24', S27), // American Express
];

describe('currentSeasonFor rule', () => {
  it('mid-season → the current year', () => {
    expect(pickCurrentSeason(PGA, '2026-11-09')?.year).toBe(2026);
  });
  it('between the last event of one season and the first of the next → the next season', () => {
    expect(pickCurrentSeason(PGA, '2026-11-24')?.year).toBe(2027);
  });
  it('no future events → the season of the last finished event', () => {
    expect(pickCurrentSeason(PGA.slice(0, 3), '2026-12-20')?.year).toBe(2026);
  });
  it('cancelled events are ignored', () => {
    const rows = [ev('2026-11-25', '2026-11-28', S26, 'cancelled'), ...PGA];
    expect(pickCurrentSeason(rows, '2026-11-24')?.year).toBe(2027);
  });
  it('the async lookup applies the same rule', async () => {
    ROWS = PGA;
    expect((await currentSeasonFor('pga', new Date('2026-11-24T12:00:00Z')))?.id).toBe('pga-2027');
    ROWS = PGA.slice(0, 3);
    expect((await currentSeasonFor('pga', new Date('2026-12-20T12:00:00Z')))?.id).toBe('pga-2026');
  });
  it('a pending cup after the last stroke event does not hold the season', () => {
    expect(pickCurrentSeason([...PGA, ev('2026-11-27', '2026-11-27', S26, 'created', 'cup')], '2026-11-24')?.year).toBe(2027);
  });
  it('a pending team event holds its season', () => {
    expect(pickCurrentSeason([...PGA, ev('2026-11-27', '2026-11-27', S26, 'created', 'team')], '2026-11-24')?.year).toBe(2026);
  });
  it('both pending and finished queries apply the stroke/team gate', async () => {
    ROWS = PGA.slice(0, 3);
    GATES = [];
    await currentSeasonFor('pga', new Date('2026-12-20T12:00:00Z'));
    expect(GATES).toEqual([['event_type', ['stroke', 'team']], ['event_type', ['stroke', 'team']]]);
  });
  it('Hero World Challenge holds PGA through 6 Dec, handing over on 7 Dec', () => {
    const rows = [...PGA, ev('2026-11-27', '2026-11-27', S26, 'created'), ev('2026-12-03', '2026-12-06', S26)];
    for (const date of ['2026-11-09', '2026-11-24', '2026-11-30', '2026-12-06']) expect(pickCurrentSeason(rows, date)?.year).toBe(2026);
    for (const date of ['2026-12-07', '2026-12-20']) expect(pickCurrentSeason(rows, date)?.year).toBe(2027);
  });
});

describe('getPgaSeasonId', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-09T12:00:00Z')); });
  it('returns 2026 while 2026 events remain, with 2027 present', async () => {
    ROWS = PGA;
    expect(await getPgaSeasonId()).toBe('pga-2026');
    vi.useRealTimers();
  });
});

describe('Schedule timeline season default', () => {
  it('puts the current season ahead of the newest one, keeping next season reachable', () => {
    const cands = [{ id: 'pga-2027' }, { id: 'pga-2026' }, { id: 'pga-2025' }];
    expect(currentFirst(cands, 'pga-2026').map((c) => c.id)).toEqual(['pga-2026', 'pga-2027', 'pga-2025']);
    expect(currentFirst(cands, null).map((c) => c.id)).toEqual(['pga-2027', 'pga-2026', 'pga-2025']);
  });
});
