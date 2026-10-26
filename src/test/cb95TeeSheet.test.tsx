import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { weekRoom } from '@/features/business/clubAnalytics/courseLead';
import { TeeSheetSection, SampleSection, teeSheetModel, teeSheetWeekLine } from '@/features/business/clubAnalytics/sections';
import type { ClubCourseAnalytics } from '@/features/business/clubAnalytics/types';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const weekdays = (counts: number[]) => counts.map((rounds, i) => ({ dow: i + 1, rounds }));
const months = (counts: number[]) => counts.map((rounds, i) => ({ month: i + 1, rounds }));
const sundridge = [34, 21, 71, 120, 90, 367, 198];
const year = [29, 29, 59, 89, 91, 87, 128, 146, 116, 48, 55, 24];
const data = (overrides: Partial<ClubCourseAnalytics> = {}) => ({ weekdays: weekdays(sundridge), months: months(year), years: [], ...overrides } as ClubCourseAnalytics);
afterEach(cleanup);

describe('CB95 weekRoom', () => {
  it('returns Saturday and Monday/Tuesday, 55 of 901, from Sundridge', () => {
    expect(weekRoom(weekdays(sundridge))).toEqual({ total: 901, busiest: { name: 'Saturday', dow: 6, rounds: 367 }, quiet: [{ name: 'Monday', dow: 1, rounds: 34 }, { name: 'Tuesday', dow: 2, rounds: 21 }], quietRounds: 55 });
  });
  it.each([
    [[1, 50, 2, 50, 50, 100, 50], [1]],
    [[4, 6, 10, 20, 20, 20, 20], [1]],
    [[5, 6, 10, 10, 10, 10, 10], [1]],
    [[100, 50, 50, 50, 50, 2, 1], [6, 7]],
    [[2, 100, 50, 50, 50, 50, 1], [7]],
  ])('chooses quiet days for %j', (counts, expected) => {
    expect(weekRoom(weekdays(counts))?.quiet.map(day => day.dow)).toEqual(expected);
  });
  it('breaks busiest and quietest ties toward earlier days', () => {
    const room = weekRoom(weekdays([10, 10, 100, 100, 50, 50, 50]));
    expect(room?.busiest.dow).toBe(3); expect(room?.quiet.map(day => day.dow)).toEqual([1, 2]);
  });
  it('zero total returns null', () => { expect(weekRoom(weekdays([0, 0, 0, 0, 0, 0, 0]))).toBeNull(); });
});

describe('CB95 computed lines', () => {
  it.each([
    [sundridge, 'Only ', '55 of 901 rounds', ' were played on a Monday or Tuesday.'],
    [[10, 20, 20, 20, 10, 10, 10], '', '10 of 100 rounds', ' were played on a Monday.'],
    [[20, 20, 20, 20, 20, 20, 20], '', '20 of 140 rounds', ' were played on a Monday.'],
    [[0, 1, 2, 1, 2, 4, 2], 'Only ', '1 of 12 rounds', ' was played on a Monday or Tuesday.'],
    [[0, 50, 1, 50, 50, 100, 50], '', 'No rounds', ' were played on a Monday.'],
    [[0, 0, 1, 50, 50, 100, 50], '', 'No rounds', ' were played on a Monday or Tuesday.'],
  ])('formats computed quiet count for %j', (counts, prefix, bold, rest) => {
    const room = weekRoom(weekdays(counts));
    if (!room) throw new Error('Expected dated rounds');
    expect(teeSheetWeekLine(room)).toEqual({ prefix, bold, rest });
  });
  it('Sundridge month extrema and April–September share give 73%', () => {
    const model = teeSheetModel(data());
    expect(model.busiest).toBe(7); expect(model.quietest).toBe(11);
    expect(model.monthLead + model.monthRest).toBe('August is your busiest month and December your quietest; 73% of play lands between April and September.');
  });
  it('month ties select the earlier month, including zero months', () => {
    const model = teeSheetModel(data({ months: months([0, 0, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1]) }));
    expect(model.busiest).toBe(2); expect(model.quietest).toBe(0);
  });
});

describe('CB95 chart selection and coverage separation', () => {
  it('week and year mark only the shared busiest and quiet choices', () => {
    render(<TeeSheetSection data={data()} />);
    expect(Array.from(screen.getByTestId('week-chart').querySelectorAll('[data-tone]')).map(el => el.getAttribute('data-tone'))).toEqual(['quiet', 'quiet', 'ordinary', 'ordinary', 'ordinary', 'busiest', 'ordinary']);
    expect(Array.from(screen.getByTestId('month-chart').querySelectorAll('[data-tone]')).map(el => el.getAttribute('data-tone'))).toEqual(['ordinary', 'ordinary', 'ordinary', 'ordinary', 'ordinary', 'ordinary', 'ordinary', 'busiest', 'ordinary', 'ordinary', 'ordinary', 'quiet']);
  });
  it('zero dated totals omit both charts', () => {
    render(<TeeSheetSection data={data({ weekdays: [], months: [] })} />);
    expect(screen.queryByTestId('week-chart')).toBeNull(); expect(screen.queryByTestId('month-chart')).toBeNull();
  });
  it('weekday-only dated data still renders the week', () => {
    render(<TeeSheetSection data={data({ months: [] })} />);
    expect(screen.getByTestId('week-chart')).toBeInTheDocument(); expect(screen.queryByTestId('month-chart')).toBeNull();
  });
  it('month-only data still renders the year', () => {
    render(<TeeSheetSection data={data({ weekdays: [] })} />);
    expect(screen.getByTestId('month-chart')).toBeInTheDocument(); expect(screen.queryByTestId('week-chart')).toBeNull();
  });
  it('year coverage moves into The sample and retains the hollow partial bar', () => {
    const selected = data({ years: [{ year: 2026, rounds: 7, partial: true }, { year: 2025, rounds: 10 }] });
    render(<SampleSection data={selected} />);
    const coverage = screen.getByTestId('sample-years');
    expect(coverage.querySelectorAll('[style*="dashed"]')).toHaveLength(1);
  });
  it('a single coverage year still omits the year bars', () => {
    render(<SampleSection data={data({ years: [{ year: 2026, rounds: 7, partial: true }] })} />);
    expect(screen.queryByTestId('sample-years')).toBeNull();
  });
});