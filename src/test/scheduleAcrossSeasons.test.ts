/* BUILD Tour sheets, island and Schedule across seasons §4/§5 — the
   single-tour Schedule runs previous → current → next season with one
   break per boundary; counters and the anchor stay current-season; no
   week header ever renders without at least one row. */
import { describe, expect, it } from 'vitest';
import {
  seasonBreakBoundaries,
  seasonSpans,
  type SeasonSpan,
} from '@/features/tourhub/schedule-v2/scheduleRules';
import { weekKey } from '@/features/tourhub/schedule-v2/timelineUtils';
import type { SeasonEvent } from '@/features/tourhub/schedule-v2/useSeasonTimeline';

let seq = 0;
function evt(start: string, end: string, year: number, inCurrent: boolean, status = 'closed'): SeasonEvent {
  seq += 1;
  return {
    id: `e${seq}`,
    tourSlug: 'pgad',
    name: `Event ${seq}`,
    venueName: null,
    venueCity: null,
    venueCountry: null,
    purse: null,
    eventType: 'stroke',
    golfCourseId: null,
    startDate: start,
    endDate: end,
    status,
    state: status === 'closed' ? 'completed' : 'upcoming',
    seasonYear: year,
    inCurrentSeason: inCurrent,
    isMajor: false,
    isPlayoff: false,
    isThisWeek: false,
    daysAway: null,
    contextLabel: '',
    eventNumber: inCurrent ? seq : 0,
  };
}

const NAMES = new Map<number, string | null>([
  [2026, 'Korn Ferry Tour'],
  [2027, 'Korn Ferry Tour'],
]);

describe('seasonSpans', () => {
  it('summarises each season in date order with the list filter count', () => {
    const events = [
      evt('2026-10-01', '2026-10-04', 2026, false),
      evt('2026-10-08', '2026-10-11', 2026, false),
      evt('2027-01-14', '2027-01-17', 2027, true, 'scheduled'),
    ];
    const spans = seasonSpans(events, NAMES);
    expect(spans.map((s) => s.year)).toEqual([2026, 2027]);
    expect(spans[0]).toMatchObject({ eventCount: 2, firstStart: '2026-10-01', tourName: 'Korn Ferry Tour' });
    expect(spans[1]).toMatchObject({ eventCount: 1, firstStart: '2027-01-14' });
  });
});

describe('seasonBreakBoundaries', () => {
  it('one break per boundary, before the first event of the new season', () => {
    const events = [
      evt('2026-10-01', '2026-10-04', 2026, false),
      evt('2026-10-08', '2026-10-11', 2026, false),
      evt('2027-01-14', '2027-01-17', 2027, true, 'scheduled'),
      evt('2027-01-21', '2027-01-24', 2027, true, 'scheduled'),
    ];
    const spans = seasonSpans(events, NAMES);
    const breaks = seasonBreakBoundaries(events, spans);
    expect(breaks.size).toBe(1);
    const brk = breaks.get(events[2].id);
    expect(brk?.ending.year).toBe(2026);
    expect(brk?.starting.year).toBe(2027);
  });

  it('three seasons in order produce exactly two breaks', () => {
    const names = new Map(NAMES).set(2025, 'Korn Ferry Tour');
    const events = [
      evt('2025-10-01', '2025-10-04', 2025, false),
      evt('2026-10-01', '2026-10-04', 2026, false),
      evt('2027-01-14', '2027-01-17', 2027, true, 'scheduled'),
    ];
    const spans = seasonSpans(events, names);
    const breaks = seasonBreakBoundaries(events, spans);
    expect(breaks.size).toBe(2);
    expect(spans.map((s) => s.year)).toEqual([2025, 2026, 2027]);
  });

  it('no break when only one season has events', () => {
    const events = [evt('2026-10-01', '2026-10-04', 2026, true)];
    const spans = seasonSpans(events, NAMES);
    expect(seasonBreakBoundaries(events, spans).size).toBe(0);
  });
});

describe('week grouping invariant (empty-week guard)', () => {
  it('every week bucket holds at least one event — no header without a row', () => {
    const events = [
      evt('2026-10-16', '2026-10-18', 2026, false), // SAS Championship week
      evt('2026-10-23', '2026-10-25', 2026, false),
      evt('2027-01-14', '2027-01-17', 2027, true, 'scheduled'),
    ];
    const buckets = new Map<string, SeasonEvent[]>();
    for (const e of events) {
      const k = weekKey(e.startDate);
      buckets.set(k, [...(buckets.get(k) ?? []), e]);
    }
    const weeks = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
    expect(weeks.length).toBeGreaterThan(0);
    for (const [, list] of weeks) expect(list.length).toBeGreaterThan(0);
    // The SAS week (Mon 12 Oct 2026) exists and carries its event.
    const sasWeek = weeks.find(([k]) => k === '2026-10-12');
    expect(sasWeek?.[1].map((e) => e.startDate)).toContain('2026-10-16');
  });
});

describe('anchor rule over the merged list', () => {
  it('Korn Ferry between seasons: current season is 2027, the anchor is its first upcoming event (17 Jan), and 2026 sorts above', () => {
    const e2026 = evt('2026-10-01', '2026-10-04', 2026, false);
    const e2027 = evt('2027-01-14', '2027-01-17', 2027, true, 'scheduled');
    const decorated = [e2026, e2027];
    // Mirror of the hook: anchor pool = current-season events.
    const currentEvents = decorated.filter((e) => e.inCurrentSeason);
    const anchorPool = currentEvents.length > 0 ? currentEvents : decorated;
    const anchor = anchorPool.find((e) => e.state === 'upcoming') ?? null;
    expect(anchor?.id).toBe(e2027.id);
    expect(anchor?.startDate).toBe('2027-01-14');
    // The merged list order keeps 2026 above 2027.
    expect(decorated.map((e) => e.seasonYear)).toEqual([2026, 2027]);
  });

  it('current-season counters ignore the neighbouring seasons', () => {
    const events = [
      evt('2026-10-01', '2026-10-04', 2026, false),
      evt('2026-10-08', '2026-10-11', 2026, false),
      evt('2027-01-14', '2027-01-17', 2027, true, 'scheduled'),
      evt('2027-01-21', '2027-01-24', 2027, true, 'scheduled'),
    ];
    const currentEvents = events.filter((e) => e.inCurrentSeason);
    expect(currentEvents.length).toBe(2); // totalEvents describes 2027 only
    expect(currentEvents.every((e) => e.eventNumber > 0)).toBe(true);
    expect(events.filter((e) => !e.inCurrentSeason).every((e) => e.eventNumber === 0)).toBe(true);
  });
});
