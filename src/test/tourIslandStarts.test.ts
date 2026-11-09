/* BUILD Tour sheets, island and Schedule across seasons §3 — the island's
   "Starts" label: a weekday only within the next 6 days, otherwise the
   date ("Starts 17 Jan", day number + short month, no year). */
import { describe, expect, it } from 'vitest';
import {
  shortDayMonth,
  singleTourCaption,
  startsLabel,
} from '@/features/tourhub/components/tourIslandRules';

const NOW = new Date('2026-11-09T13:00:00Z'); // Monday 9 Nov 2026

describe('startsLabel', () => {
  it('0 days out: today reads as the weekday', () => {
    expect(startsLabel('2026-11-09', NOW)).toBe('Starts Mon');
  });
  it('6 days out: still the weekday', () => {
    expect(startsLabel('2026-11-15', NOW)).toBe('Starts Sun');
  });
  it('7 days out: the date, not the weekday', () => {
    expect(startsLabel('2026-11-16', NOW)).toBe('Starts 16 Nov');
  });
  it('the Korn Ferry case: 17 Jan 2027 reads "Starts 17 Jan", never "STARTS SUN"', () => {
    expect(startsLabel('2027-01-17', NOW)).toBe('Starts 17 Jan');
  });
  it('shortDayMonth: day number + short month, no year', () => {
    expect(shortDayMonth('2027-01-17')).toBe('17 Jan');
    expect(shortDayMonth('2026-03-05')).toBe('5 Mar');
  });
  it('singleTourCaption upcoming uses the same rule', () => {
    const caption = singleTourCaption('upcoming', null, '2027-01-17');
    expect(caption.text).toBe('Starts 17 Jan');
    expect(caption.live).toBe(false);
  });
});
