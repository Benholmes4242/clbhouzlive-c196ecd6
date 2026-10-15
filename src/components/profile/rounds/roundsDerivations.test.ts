import { describe, expect, it } from 'vitest';
import { courseStats, monthHighlights, monthStats, seasonCompare, yearStats } from './roundsDerivations';
import type { ProfileRound } from './useProfileRounds';

let n = 0;
const R = (o: Partial<ProfileRound>): ProfileRound => ({
  whs_score_id: `s${n++}`, play_date: '2026-05-10', course_id: 'c1', course_name: 'Alpha',
  course_par: 72, gross_score: 80, hcp_at_time: 10, nett_score: 70, delta_index: null,
  eagles: 0, albatrosses: 0, holes_in_one: 0, clean_card: false,
  is_nine_hole: false, total_holes: 18, handicap_differential: 8, handicap_index_at_time: 10,
  whs_joined: true, ...o,
});

describe('roundsDerivations', () => {
  it('nine-hole round counts in rounds but not in the average', () => {
    const y = yearStats([R({ gross_score: 80 }), R({ gross_score: 40, is_nine_hole: true, total_holes: 9 })]).get(2026)!;
    expect(y).toEqual({ rounds: 2, scoringRounds: 1, avg: 80 });
  });

  it('whs_joined:false round is excluded from the average', () => {
    const y = yearStats([R({ gross_score: 80 }), R({ gross_score: 60, whs_joined: false, is_nine_hole: null, total_holes: null })]).get(2026)!;
    expect(y).toEqual({ rounds: 2, scoringRounds: 1, avg: 80 });
  });

  it('null gross counts in rounds but not in the average', () => {
    const y = yearStats([R({ gross_score: 80 }), R({ gross_score: null })]).get(2026)!;
    expect(y).toEqual({ rounds: 2, scoringRounds: 1, avg: 80 });
  });

  it('31 December and 1 January land in their own years', () => {
    const ys = yearStats([R({ play_date: '2025-12-31' }), R({ play_date: '2026-01-01' })]);
    expect(ys.get(2025)!.rounds).toBe(1);
    expect(ys.get(2026)!.rounds).toBe(1);
  });

  it('a month with one scoring round averages that gross', () => {
    expect(monthStats([R({ play_date: '2026-03-04', gross_score: 77 })], 2026)[2].avg).toBe(77);
  });

  it('a month with no scoring round has avg null', () => {
    const m = monthStats([R({ play_date: '2026-03-04', is_nine_hole: true, total_holes: 9 })], 2026);
    expect(m[2]).toEqual({ rounds: 1, scoringRounds: 0, avg: null });
    expect(m[3].avg).toBeNull();
  });

  it('null course_id groups by name and does not merge different courses', () => {
    const cs = courseStats([
      R({ course_id: null, course_name: 'Beta' }), R({ course_id: null, course_name: 'Beta' }),
      R({ course_id: null, course_name: 'Gamma' }),
    ]);
    expect(cs.map((c) => [c.key, c.rounds])).toEqual([['name:Beta', 2], ['name:Gamma', 1]]);
  });

  it('seasonCompare delta is positive when this year is lower', () => {
    const s = seasonCompare([R({ play_date: '2026-04-01', gross_score: 78 }), R({ play_date: '2025-04-01', gross_score: 82 })], 2026);
    expect(s).toEqual({ thisAvg: 78, lastAvg: 82, delta: 4 });
  });

  it('seasonCompare is null when last year has no scoring rounds', () => {
    const s = seasonCompare([R({ play_date: '2026-04-01' }), R({ play_date: '2025-04-01', gross_score: null })], 2026);
    expect(s.lastAvg).toBeNull();
    expect(s.delta).toBeNull();
  });
});

describe('monthHighlights', () => {
  it('names busiest and best month from three scored months', () => {
    const rs = [
      R({ play_date: '2026-03-01', gross_score: 80 }), R({ play_date: '2026-03-08', gross_score: 82 }),
      R({ play_date: '2026-04-01', gross_score: 75 }), R({ play_date: '2026-05-01', gross_score: 85 }),
    ];
    expect(monthHighlights(rs, 2026)).toEqual({ busiest: 2, best: 3 });
  });
  it('is null with fewer than three scored months', () => {
    expect(monthHighlights([R({ play_date: '2026-03-01' }), R({ play_date: '2026-04-01' })], 2026)).toBeNull();
  });
  it('is null on a busiest-month tie', () => {
    const rs = [R({ play_date: '2026-03-01', gross_score: 80 }), R({ play_date: '2026-04-01', gross_score: 75 }), R({ play_date: '2026-05-01', gross_score: 85 })];
    expect(monthHighlights(rs, 2026)).toBeNull();
  });
});
