import { describe, it, expect } from 'vitest';
import { normaliseRankingName, rankingTourLabel, formatPoints } from './tourDataDisplay';

describe('Tour data display rules', () => {
  it('title-cases all-caps surnames', () => {
    expect(normaliseRankingName('Patrick REED')).toBe('Patrick Reed');
  });
  it('leaves mixed-case names alone', () => {
    expect(normaliseRankingName('Bryson DeChambeau')).toBe('Bryson DeChambeau');
  });
  it('maps ranking tour codes', () => {
    expect(rankingTourLabel('euro')).toBe('DP World');
    expect(rankingTourLabel('pgad')).toBe('Americas');
    expect(rankingTourLabel('pga')).toBe('PGA');
  });
  it('formats points with one decimal and separators', () => {
    expect(formatPoints(3713.9)).toBe('3,713.9');
    expect(formatPoints(788.66)).toBe('788.7');
  });
});
