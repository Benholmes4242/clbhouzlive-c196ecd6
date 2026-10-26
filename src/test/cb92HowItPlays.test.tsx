import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ClubCourseAnalytics } from '@/features/business/clubAnalytics/types';
import { HowItPlaysSection } from '@/features/business/clubAnalytics/sections';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

type O = ClubCourseAnalytics['outcomes'];
function payload(over: Partial<ClubCourseAnalytics> = {}, outcomes: Partial<O> = {}): ClubCourseAnalytics {
  const o = { ace: 0, albatross: 0, eagle: 18, birdie: 962, par: 6210, bogey: 5122, double_plus: 1993, ...outcomes } as O;
  const total = Object.values(o).reduce((s, n) => s + (n as number), 0);
  return {
    course_id: 'east', course_name: 'East', club_courses: [], rounds: 901, members: 21, complete_rounds: 817, hole_rows: 0,
    first_round: '2018-03-01', last_round: null, avg_gross: 81.7,
    holes: [{ hole_no: 18, stroke_index: 5, measured_rank: 1 }, { hole_no: 3, stroke_index: 1, measured_rank: 2 }] as unknown as ClubCourseAnalytics['holes'],
    outcomes: o, outcomes_total: total, months: [], weekdays: [], years: [], tees: [], handicap_bands: [], handicap_rounds: 0,
    competition: null, record_book: null, ...over,
  } as ClubCourseAnalytics;
}
const tiles = () => screen.getAllByTestId('how-it-plays-tile').map(t => t.textContent);
const rows = () => screen.queryAllByTestId('how-it-plays-row').map(r => {
  const label = r.textContent; const count = r.nextElementSibling!; const share = count.nextElementSibling!;
  return [label, count.textContent, share.textContent];
});
afterEach(cleanup);

describe('CB92 How it plays', () => {
  it('Sundridge East reads its tiles, rows, note and kicker', () => {
    const d = payload(); expect(d.outcomes_total).toBe(14305);
    render(<HowItPlaysSection data={d} />);
    expect(tiles()).toEqual(['81.7typical 18-hole score', '50%of holes made in par or better', '18hardest hole; your card makes it 5']);
    expect(rows()).toEqual([['Eagle', '18', '0.1%'], ['Birdie', '962', '7%'], ['Par', '6,210', '43%'], ['Bogey', '5,122', '36%'], ['Double +', '1,993', '14%']]);
    expect(screen.getByTestId('how-it-plays-note').textContent).toBe('No hole in one or albatross here yet.');
    expect(screen.getByTestId('how-it-plays-total').textContent).toBe('14,305 HOLES');
  });
  it('an ace of 3 in 38,412 has a <0.1% row and a visible bar segment', () => {
    render(<HowItPlaysSection data={payload({}, { ace: 3, eagle: 41, birdie: 1702, par: 13240, bogey: 14117, double_plus: 9309 })} />);
    expect(screen.getByTestId('how-it-plays-total').textContent).toBe('38,412 HOLES');
    expect(rows()[0]).toEqual(['Hole in one', '3', '<0.1%']);
    const seg = screen.getByTestId('how-it-plays-bar').querySelector('[data-key="ace"]') as HTMLElement;
    expect(seg).not.toBeNull();
    expect(Number(seg.style.flexGrow)).toBeCloseTo(38412 * 0.006, 3);
  });
  it('stroke index 1 reads as your card says', () => {
    render(<HowItPlaysSection data={payload({ holes: [{ hole_no: 4, stroke_index: 1, measured_rank: 1 }] as never })} />);
    expect(tiles()[2]).toBe('4hardest hole, as your card says');
  });
  it('null stroke index reads plain hardest hole', () => {
    render(<HowItPlaysSection data={payload({ holes: [{ hole_no: 4, stroke_index: null, measured_rank: 1 }] as never })} />);
    expect(tiles()[2]).toBe('4hardest hole');
  });
  it('no full rounds gives a dash and the once-a-full-round label', () => {
    render(<HowItPlaysSection data={payload({ complete_rounds: 0 })} />);
    expect(tiles()[2]).toBe('–hardest hole, once a full round is in');
  });
  it('no rank-1 hole gives the same dash', () => {
    render(<HowItPlaysSection data={payload({ holes: [] })} />);
    expect(tiles()[2]).toBe('–hardest hole, once a full round is in');
  });
  it('null avg_gross gives a dash', () => {
    render(<HowItPlaysSection data={payload({ avg_gross: null })} />);
    expect(tiles()[0]).toBe('–typical 18-hole score, once a full round is in');
  });
  it('zero note, one form', () => {
    render(<HowItPlaysSection data={payload({}, { ace: 1, albatross: 0, eagle: 2 })} />);
    expect(screen.getByTestId('how-it-plays-note').textContent).toBe('No albatross here yet.');
  });
  it('zero note, three form', () => {
    render(<HowItPlaysSection data={payload({}, { eagle: 0 })} />);
    expect(screen.getByTestId('how-it-plays-note').textContent).toBe('No hole in one, albatross or eagle here yet.');
    expect(rows().map(r => r[0])).toEqual(['Birdie', 'Par', 'Bogey', 'Double +']);
  });
  it('no note when all are above zero', () => {
    render(<HowItPlaysSection data={payload({}, { ace: 1, albatross: 1 })} />);
    expect(screen.queryByTestId('how-it-plays-note')).toBeNull();
    expect(rows().map(r => r[0])).toEqual(['Hole in one', 'Albatross', 'Eagle', 'Birdie', 'Par', 'Bogey', 'Double +']);
  });
  it('outcomes_total 0 draws tiles only with a dash for tile 2', () => {
    render(<HowItPlaysSection data={payload({}, { eagle: 0, birdie: 0, par: 0, bogey: 0, double_plus: 0 })} />);
    expect(tiles()[1]).toBe('–of holes made in par or better');
    expect(screen.queryByTestId('how-it-plays-bar')).toBeNull();
    expect(rows()).toEqual([]);
    expect(screen.queryByTestId('how-it-plays-note')).toBeNull();
  });
});
