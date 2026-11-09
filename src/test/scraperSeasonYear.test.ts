import { describe, expect, it } from 'vitest';
import { pickSeasonYear } from '../../supabase/functions/scrape-tour-rankings/seasonYear';

const event = (year: number, start: string, end: string, event_type = 'stroke', status = 'scheduled') => ({ season: { year }, start_date: start, end_date: end, event_type, status });
describe('DP World server season-year mirror', () => {
  it('uses the earliest pending season, including the late-November 2027 opening', () => {
    const rows = [event(2026, '2026-11-12', '2026-11-15'), event(2027, '2026-11-26', '2026-11-29')];
    expect(pickSeasonYear(rows, '2026-11-09')).toBe(2026);
    expect(pickSeasonYear(rows, '2026-11-24')).toBe(2027);
  });
  it('ignores cup/match and cancelled events but accepts team', () => {
    const rows = [event(2026, '2026-11-25', '2026-11-28', 'cup'), event(2026, '2026-11-25', '2026-11-28', 'match'), event(2026, '2026-11-25', '2026-11-28', 'stroke', 'cancelled'), event(2027, '2026-11-26', '2026-11-29', 'team')];
    expect(pickSeasonYear(rows, '2026-11-24')).toBe(2027);
  });
  it('uses the latest finished season, or null for calendar fallback with no data', () => {
    expect(pickSeasonYear([event(2026, '2026-11-12', '2026-11-15'), event(2025, '2025-11-12', '2025-11-15')], '2026-12-20')).toBe(2026);
    expect(pickSeasonYear([], '2026-12-20')).toBeNull();
  });
});