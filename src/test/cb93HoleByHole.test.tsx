import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ClubAnalyticsHole, ClubCourseAnalytics } from '@/features/business/clubAnalytics/types';
import { HoleBySection, HowItPlaysSection } from '@/features/business/clubAnalytics/sections';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const rankOrder = [18, 7, 14, 2, 12, 5, 15, 4, 17, 1, 8, 10, 9, 16, 6, 3, 13, 11];
function hole(n: number): ClubAnalyticsHole {
  const rank = rankOrder.indexOf(n) + 1;
  return { hole_no: n, par: 4, stroke_index: 5, measured_rank: rank, avg_to_par: (19 - rank) / 18,
    rounds: 738, yards: n === 18 ? 402 : null, low_to_par: null, low_rows: 0, high_to_par: null,
    high_rows: 0, spread: null, si_should_be: null, places_gap: null, shots_gap: null,
    birdie_plus: 31, par_count: 248, bogey: 301, double_plus: 158 };
}
function payload(overrides: Partial<ClubCourseAnalytics> = {}): ClubCourseAnalytics {
  return { course_id: 'east', course_name: 'Sundridge Park Golf Club (East Course)', club_courses: [],
    rounds: 901, complete_rounds: 738, hole_rows: 13284, members: 21, first_round: null, last_round: null,
    avg_gross: 81.7, holes: Array.from({ length: 18 }, (_, i) => hole(i + 1)),
    outcomes: { ace: 0, albatross: 0, eagle: 0, birdie: 31, par: 248, bogey: 301, double_plus: 158 },
    outcomes_total: 738, months: [], weekdays: [], years: [], tees: [], handicap_bands: [], handicap_rounds: 0,
    competition: null, record_book: null, ...overrides };
}
const card = () => screen.getByTestId('hole-by-hole');
const rowNumbers = () => within(card()).getAllByRole('button').map(row => Number(row.getAttribute('aria-label')?.replace('Hole ', '')));
afterEach(cleanup);

describe('CB93 Hole by hole', () => {
  it('defaults to hardest first, then switches the same holes to card order', () => {
    render(<HoleBySection data={payload()} />);
    expect(screen.getByRole('tab', { name: 'Hardest first' })).toHaveAttribute('aria-selected', 'true');
    expect(rowNumbers()).toEqual(rankOrder);
    fireEvent.click(screen.getByRole('tab', { name: 'Card order' }));
    expect(rowNumbers()).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(screen.getByRole('tab', { name: 'Card order' })).toHaveAttribute('aria-selected', 'true');
  });
  it('takes the hardest and easiest from measured ranks, not card position', () => {
    render(<HoleBySection data={payload()} />);
    expect(within(card()).getByRole('heading').textContent).toBe('Hole 18 plays hardest, hole 11 easiest');
  });
  it('renders five header cells and five cells per hole', () => {
    render(<HoleBySection data={payload()} />);
    expect(screen.getByTestId('hole-table-head').children).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Hole 18' }).children).toHaveLength(5);
    expect(screen.getByTestId('hole-table-head').lastElementChild?.textContent).toBe('');
  });
  it('null par, SI and mean keep three dashes and no measured bar', () => {
    const unmeasured = { ...hole(18), par: null, stroke_index: null, avg_to_par: null } as unknown as ClubAnalyticsHole;
    render(<HoleBySection data={payload({ holes: [unmeasured, hole(11)] })} />);
    const row = screen.getByRole('button', { name: 'Hole 18' });
    expect(Array.from(row.children).map(cell => cell.textContent)).toEqual(['18', '—', '—', '', '—']);
    expect(row.children[3]?.children).toHaveLength(0);
  });
  it('under-par means retain the canonical signed formatter', () => {
    render(<HoleBySection data={payload({ holes: [{ ...hole(18), avg_to_par: -0.2 }, hole(11)] })} />);
    expect(screen.getByRole('button', { name: 'Hole 18' }).lastElementChild?.textContent).toBe('−0.2');
  });
  it('opens one inset with known yards, four counts and denominator-based shares', () => {
    render(<HoleBySection data={payload()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 18' }));
    const inset = screen.getByTestId('hole-inset');
    expect(inset.firstElementChild?.textContent).toBe('HOLE 18 · 402 YD · 738 ROUNDS');
    const rows = within(inset).getAllByTestId('hole-split-row');
    expect(rows).toHaveLength(4);
    expect(rows.map(row => [row.nextElementSibling?.textContent, row.nextElementSibling?.nextElementSibling?.textContent])).toEqual([
      ['31', '4%'], ['248', '34%'], ['301', '41%'], ['158', '21%'],
    ]);
    expect(screen.getByRole('button', { name: 'Hole 18' })).toHaveAttribute('aria-expanded', 'true');
  });
  it('opening another hole closes the previous one and omits absent yards', () => {
    render(<HoleBySection data={payload()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 18' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    expect(screen.getAllByTestId('hole-inset')).toHaveLength(1);
    expect(screen.getByTestId('hole-inset').firstElementChild?.textContent).toBe('HOLE 7 · 738 ROUNDS');
    expect(screen.getByRole('button', { name: 'Hole 18' })).toHaveAttribute('aria-expanded', 'false');
  });
  it('tapping the open hole closes its inset', () => {
    render(<HoleBySection data={payload()} />);
    const row = screen.getByRole('button', { name: 'Hole 18' });
    fireEvent.click(row); fireEvent.click(row);
    expect(screen.queryByTestId('hole-inset')).toBeNull();
    expect(row).toHaveAttribute('aria-expanded', 'false');
  });
  it('keeps the same expanded hole across a sort toggle', () => {
    render(<HoleBySection data={payload()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Card order' }));
    expect(screen.getByRole('button', { name: 'Hole 7' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByTestId('hole-inset')).toHaveLength(1);
  });
  it('closes the inset when its hole is no longer visible', () => {
    const view = render(<HoleBySection data={payload()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    view.rerender(<HoleBySection data={payload({ holes: [hole(18), hole(11)] })} />);
    expect(screen.queryByTestId('hole-inset')).toBeNull();
  });
  it('has no top split while How it plays retains its own split', () => {
    render(<><HowItPlaysSection data={payload()} /><HoleBySection data={payload()} /></>);
    expect(within(card()).queryAllByTestId('hole-split-row')).toHaveLength(0);
    expect(within(card()).queryAllByText('Birdie +')).toHaveLength(0);
    expect(screen.getByTestId('how-it-plays-bar').children).toHaveLength(4);
  });
  it('zero full rounds removes controls and rows, using the single-course business label and singular round', () => {
    render(<HoleBySection data={payload({ complete_rounds: 0, rounds: 1 })} businessName="  Fenwick Park Golf Club  " courseCount={1} />);
    expect(within(card()).queryAllByRole('button')).toHaveLength(0);
    expect(within(card()).queryAllByRole('tab')).toHaveLength(0);
    expect(card().querySelector('p')?.textContent).toContain('Fenwick Park has 1 round so far, none with every hole.');
    expect(card().querySelectorAll('p')).toHaveLength(1);
  });
  it('no hole rows removes controls even when complete_rounds is positive and uses the within-club label', () => {
    render(<HoleBySection data={payload({ holes: [], rounds: 12 })} businessName="Sundridge Park Golf Club" courseCount={2} />);
    expect(within(card()).queryAllByRole('button')).toHaveLength(0);
    expect(card().querySelector('p')?.textContent).toContain('the East Course has 12 rounds so far, none with every hole.');
  });
  it('zero outcome counts still open a four-row inset with zero shares', () => {
    render(<HoleBySection data={payload({ holes: [{ ...hole(18), birdie_plus: 0, par_count: 0, bogey: 0, double_plus: 0 }] })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 18' }));
    expect(screen.getByTestId('hole-split-bar').children).toHaveLength(0);
    expect(screen.getAllByTestId('hole-split-row').map(row => row.nextElementSibling?.nextElementSibling?.textContent)).toEqual(['0%', '0%', '0%', '0%']);
  });
});