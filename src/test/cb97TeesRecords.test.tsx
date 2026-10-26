import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { TeesSection, RecordBookSection } from '@/features/business/clubAnalytics/sections';

const tee = (yards: number, rounds: number, avg_to_par: number, mean_index: number | null) => ({ yards, rounds, avg_to_par, mean_index, low: 0, mid: 0, high: 0, with_index: rounds });
const EAST = [tee(6600, 164, 8.9, 2.5), tee(6500, 468, 11.4, 6.1), tee(6400, 31, 12.4, 7.5), tee(6200, 51, 9.0, 4.5), tee(6100, 24, 10.0, 4.9)];
const D = (o: any) => o as any;
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('CB97 Your tees', () => {
  it('Sundridge East', () => {
    const v = render(<TeesSection data={D({ tees: EAST })} />);
    expect(screen.getByTestId('tees-title').textContent).toBe('63% of rounds are played off 6,500 yards');
    expect(v.container.textContent).toContain('738 rounds');
    const subs = screen.getAllByTestId('tee-sub').map(e => e.textContent);
    expect(subs[0]).toBe('22% of play · mean index 2.5');
    const bars = screen.getAllByTestId('tee-bar').map(e => parseFloat((e as HTMLElement).style.width));
    expect(bars[1]).toBe(100); expect(bars[0]).toBeCloseTo((164 / 468) * 100, 3);
    expect(v.container.textContent).not.toMatch(/single figures|mixed field/i);
  });
  it('one tee', () => {
    render(<TeesSection data={D({ tees: [tee(6500, 40, 10, 5)] })} />);
    expect(screen.getByTestId('tees-title').textContent).toBe('Every round we hold is played off 6,500 yards');
  });
  it('null mean index drops the index part; negative shows plus', () => {
    render(<TeesSection data={D({ tees: [tee(6600, 20, 5, null), tee(6500, 20, 5, -1.2)] })} />);
    const subs = screen.getAllByTestId('tee-sub').map(e => e.textContent);
    expect(subs[0]).toBe('50% of play'); expect(subs[1]).toBe('50% of play · mean index +1.2');
  });
  it('no tees', () => {
    const v = render(<TeesSection data={D({ tees: [] })} />);
    expect(v.container.textContent).toContain('No yardage has 10 rounds on it yet.');
    expect(screen.queryAllByTestId('tee-row')).toHaveLength(0);
  });
});

const RB = (o: any = {}) => ({ record_book: {
  lowest_gross: { value: 65, attained_at: '2026-06-27', changed_hands: 4 },
  best_stableford: { value: 47, attained_at: '2021-07-20' },
  most_birdies: { value: 136, attained_at: null },
  rounds_since_record: 91, ...o } });

describe('CB97 Records', () => {
  it('Sundridge East rows and link', () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-26T12:00:00Z'));
    const go = vi.fn();
    render(<RecordBookSection data={D(RB())} onSeeChampions={go} />);
    expect(screen.getAllByTestId('record-meta').map(e => e.textContent)).toEqual([
      'Set 27 Jun 2026 · 91 rounds since · 4 golfers have held it', 'Set 20 Jul 2021 · has stood 5 years', 'A career total here, not one round']);
    expect(screen.getAllByTestId('record-value').map(e => e.textContent)).toEqual(['65', '47', '136']);
    fireEvent.click(screen.getByRole('button', { name: /See who holds them/ })); expect(go).toHaveBeenCalledTimes(1);
  });
  it('under a year, one holder, zero since, missing record', () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-26T12:00:00Z'));
    render(<RecordBookSection data={D(RB({ lowest_gross: { value: 65, attained_at: '2026-06-27', changed_hands: 1 }, best_stableford: { value: 47, attained_at: '2026-01-02' }, most_birdies: null, rounds_since_record: 0 }))} />);
    expect(screen.getAllByTestId('record-meta').map(e => e.textContent)).toEqual(['Set 27 Jun 2026', 'Set 2 Jan 2026']);
    expect(screen.getAllByTestId('record-row')).toHaveLength(2);
  });
  it('no values renders no card', () => {
    const v = render(<RecordBookSection data={D(RB({ lowest_gross: null, best_stableford: null, most_birdies: null }))} />);
    expect(v.container.innerHTML).toBe('');
  });
});
