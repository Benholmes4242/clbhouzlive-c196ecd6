import { describe, it, expect } from 'vitest';
import { fitTextRuns } from '@/components/profile/hero/topTenShare/measuredEllipsis';

describe('Shared live/export measured ellipsis', () => {
  const measure = (text: string) => Array.from(text).length * 10;
  it('preserves an exactly fitting line without a suffix', () => {
    expect(fitTextRuns([{ text: 'Dunluce' }], 70, measure)).toEqual(['Dunluce']);
  });
  it('replaces overflowing characters with a measured ellipsis', () => {
    expect(fitTextRuns([{ text: 'Dunluce · Co. Londonderry' }], 210, measure)).toEqual(['Dunluce · Co. London…']);
  });
  it('retains mixed-font runs and truncates the overflowing run', () => {
    expect(fitTextRuns([{ text: 'Royal ' }, { text: 'County Down' }], 130, measure)).toEqual(['Royal ', 'County…']);
  });
  it('does not split a Unicode code point', () => {
    expect(fitTextRuns([{ text: 'A🏌BC' }], 30, measure)).toEqual(['A🏌…']);
  });
  it('uses each run’s own width measurement', () => {
    expect(fitTextRuns([{ text: 'AB', unit: 10 }, { text: 'cdef', unit: 5 }], 35, (text, run) => text.length * run.unit)).toEqual(['AB', 'cd…']);
  });
  it('never overflows when even the ellipsis cannot fit', () => {
    expect(fitTextRuns([{ text: 'Royal' }], 5, measure)).toEqual(['']);
  });
});