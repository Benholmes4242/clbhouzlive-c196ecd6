import { describe, expect, it } from 'vitest';
import { courseLead } from './courseLead';
import type { ClubCourseAnalytics } from './types';

export function analytics(overrides: Partial<ClubCourseAnalytics> = {}): ClubCourseAnalytics {
  return { course_id: 'east', course_name: 'Sundridge Park Golf Club (East Course)', club_courses: [], rounds: 901, complete_rounds: 900, hole_rows: 16200, members: 21, first_round: '2018-03-12T00:00:00Z', last_round: null, avg_gross: 81.7,
    holes: [{ hole_no: 18, measured_rank: 1, par: 4, stroke_index: 2, avg_to_par: 1, rounds: 900, yards: 400, low_to_par: null, low_rows: 0, high_to_par: null, high_rows: 0, spread: null, si_should_be: null, places_gap: null, shots_gap: null, birdie_plus: 0, par_count: 0, bogey: 0, double_plus: 0 }],
    outcomes: { double_plus: 0, bogey: 0, par: 0, birdie: 0, eagle: 0, albatross: 0, ace: 0 }, outcomes_total: 0, months: [], weekdays: [34, 21, 71, 120, 90, 367, 198].map((rounds, i) => ({ dow: i + 1, rounds })), years: [], tees: [], handicap_bands: [], handicap_rounds: 0, competition: null, record_book: null, ...overrides };
}
const context = { courseCount: 2, businessName: 'Sundridge Park Golf Club' };
const leadWeek = (counts: number[]) => courseLead(analytics({ weekdays: counts.map((rounds, i) => ({ dow: i + 1, rounds })) }), context).line;

describe('CB91 courseLead', () => {
  it('matches the Sundridge East selected-payload example exactly', () => {
    expect(courseLead(analytics(), context)).toEqual({ early: false, headline: 'Golfers on clbhouz go round the East Course in 81.7.', emphasis: 'Hole 18 plays hardest.', line: 'From 901 rounds by 21 golfers since March 2018. Saturday is your busiest day; Monday and Tuesday have the most room.' });
  });
  it.each(['Golf Club', 'Golf Course', 'GC'])('single-course label trims only trailing %s without adding the', suffix => {
    expect(courseLead(analytics(), { courseCount: 1, businessName: `Hartwell Heath ${suffix}` }).headline).toBe('Golfers on clbhouz go round Hartwell Heath in 81.7.');
  });
  it('retains a business name without the specified suffix', () => {
    expect(courseLead(analytics(), { courseCount: 1, businessName: 'Hartwell Heath Links' }).headline).toContain('round Hartwell Heath Links in');
  });
  it('does not double an existing the in the within-club course name', () => {
    expect(courseLead(analytics({ course_name: 'Club (the East Course)' }), context).headline).toBe('Golfers on clbhouz go round the East Course in 81.7.');
  });
  it('no complete rounds omits emphasis and states the full-round limitation', () => {
    const lead = courseLead(analytics({ complete_rounds: 0 }), context);
    expect(lead.emphasis).toBe('');
    expect(lead.line).toContain('since March 2018, too few full rounds yet to say which hole plays hardest.');
  });
  it('missing rank one also omits emphasis and adds the limitation', () => {
    const lead = courseLead(analytics({ holes: [] }), context);
    expect(lead.emphasis).toBe(''); expect(lead.line).toContain(', too few full rounds yet to say which hole plays hardest.');
  });
  it('null average omits the headline', () => { expect(courseLead(analytics({ avg_gross: null }), context).headline).toBe(''); });
  it('average is formatted to one decimal including a trailing zero', () => { expect(courseLead(analytics({ avg_gross: 91 }), context).headline).toContain('in 91.0.'); });
  it('names only the single quietest when the second quietest is nonadjacent', () => { expect(leadWeek([1, 50, 2, 50, 50, 100, 50])).toContain('Saturday is your busiest day; Monday has the most room.'); });
  it('names adjacent quiet days in week order even when the later day is quieter', () => { expect(leadWeek([2, 1, 50, 50, 50, 100, 50])).toContain('Monday and Tuesday have the most room.'); });
  it('at exactly ten percent names only the quietest', () => { expect(leadWeek([4, 6, 10, 20, 20, 20, 20])).toContain('Thursday is your busiest day; Monday has the most room.'); });
  it('above ten percent names only the quietest', () => { expect(leadWeek([5, 6, 10, 10, 10, 10, 10])).toContain('Wednesday is your busiest day; Monday has the most room.'); });
  it('busiest and quietest ties choose the earlier ISO weekday', () => { expect(leadWeek([10, 10, 100, 100, 50, 50, 50])).toContain('Wednesday is your busiest day; Monday and Tuesday have the most room.'); });
  it('Saturday and Sunday can form a quiet pair', () => { expect(leadWeek([100, 50, 50, 50, 50, 2, 1])).toContain('Monday is your busiest day; Saturday and Sunday have the most room.'); });
  it('Sunday and Monday never wrap into a pair', () => { expect(leadWeek([2, 100, 50, 50, 50, 50, 1])).toContain('Tuesday is your busiest day; Sunday has the most room.'); });
  it.each([49, 50])('early threshold at %i rounds', rounds => {
    const lead = courseLead(analytics({ rounds }), context);
    expect(lead.early).toBe(rounds === 49);
    expect(lead.line.endsWith(' Every figure firms up as more of your members connect.')).toBe(rounds === 49);
  });
  it('uses singular round and golfer and omits null first date and empty week', () => {
    expect(courseLead(analytics({ rounds: 1, members: 1, first_round: null, weekdays: [], complete_rounds: 0 }), context).line).toBe('From 1 round by 1 golfer, too few full rounds yet to say which hole plays hardest. Every figure firms up as more of your members connect.');
  });
  it('formats thousands separators at 2140 rounds', () => { expect(courseLead(analytics({ rounds: 2140 }), context).line).toContain('From 2,140 rounds'); });
  it('zero rounds omits the full-round limitation and weekday sentence', () => {
    expect(courseLead(analytics({ rounds: 0, members: 0, complete_rounds: 0, weekdays: [], first_round: null }), context).line).toBe('From 0 rounds by 0 golfers. Every figure firms up as more of your members connect.');
  });
});