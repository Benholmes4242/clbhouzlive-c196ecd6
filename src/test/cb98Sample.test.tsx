import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { SampleSection } from '@/features/business/clubAnalytics/sections';
import * as sections from '@/features/business/clubAnalytics/sections';
afterEach(cleanup);

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year, i) => ({ year, rounds: [20, 40, 60, 80, 90, 100, 120, 160, 140][i], partial: year === 2026 }));
const east = (o: any = {}) => ({ members: 21, rounds: 901, complete_rounds: 738, first_round: '2018-03-04', years: YEARS, competition: { competition: 535, social: 366 }, ...o }) as any;

describe('CB98 The sample', () => {
  it('Sundridge East', () => {
    render(<SampleSection data={east()} />);
    expect(screen.getAllByTestId('sample-figure').map(e => e.textContent)).toEqual(['21', '901', '2018']);
    expect(screen.getByTestId('sample-line').textContent).toBe('Every golfer who connects their handicap adds their rounds here, back to March 2018, so each year holds more:');
    const bars = screen.getAllByTestId('sample-year');
    expect(bars).toHaveLength(9);
    expect(bars.find(b => b.dataset.year === '2025')!.dataset.tone).toBe('busiest');
    expect(bars.find(b => b.dataset.year === '2026')!.dataset.tone).toBe('partial');
    expect(screen.getByTestId('sample-fine').textContent).toBe('2026 so far, drawn hollow. 738 of the 901 rounds carry all 18 holes, and the hole figures come from those. 535 were competition rounds and 366 social.');
  });
  it('one year: no bars and the full-stop line', () => {
    render(<SampleSection data={east({ years: [{ year: 2026, rounds: 9, partial: true }] })} />);
    expect(screen.queryByTestId('sample-years')).toBeNull();
    expect(screen.getByTestId('sample-line').textContent).toBe('Every golfer who connects their handicap adds their rounds here, back to March 2018.');
    expect(screen.getByTestId('sample-fine').textContent).not.toContain('drawn hollow');
  });
  it('zero complete rounds', () => {
    render(<SampleSection data={east({ complete_rounds: 0 })} />);
    expect(screen.getByTestId('sample-fine').textContent).toContain('None of the 901 rounds carries all 18 holes yet.');
  });
  it('one round singular forms', () => {
    render(<SampleSection data={east({ rounds: 1, complete_rounds: 1, years: [], competition: null })} />);
    expect(screen.getByTestId('sample-fine').textContent).toMatch(/^The one round carries all 18 holes/);
    cleanup();
    render(<SampleSection data={east({ rounds: 1, complete_rounds: 0, years: [], competition: null })} />);
    expect(screen.getByTestId('sample-fine').textContent).toBe('The one round does not carry all 18 holes yet.');
  });
  it('no competition sentence without competition', () => {
    render(<SampleSection data={east({ competition: null })} />);
    expect(screen.getByTestId('sample-fine').textContent).not.toMatch(/competition rounds/);
  });
  it('null first_round gives a dash and no date part', () => {
    render(<SampleSection data={east({ first_round: null })} />);
    expect(screen.getAllByTestId('sample-figure')[2].textContent).toBe('–');
    expect(screen.getByTestId('sample-line').textContent).toBe('Every golfer who connects their handicap adds their rounds here, so each year holds more:');
  });
  it('removed sections are gone and no amber anywhere on the page', () => {
    expect((sections as any).YearOnYearSection).toBeUndefined();
    expect((sections as any).CompetitionSection).toBeUndefined();
    expect((sections as any).StatStrip).toBeUndefined();
    for (const f of ['../features/business/clubAnalytics/sections.tsx', '../pages/ClubAnalyticsPage.tsx']) {
      const src = readFileSync(resolve(__dirname, f), 'utf8');
      expect(src).not.toMatch(/AMBER|#F7931E/i);
    }
  });
});
