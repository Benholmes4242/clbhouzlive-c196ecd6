import { describe, it, expect } from 'vitest';
import { matchKey, normaliseRankingName, rankingTourLabel, formatPoints, feedsHeadline } from './tourDataDisplay';

describe('Tour data display rules', () => {
  it('matches case and collapsed whitespace', () => {
    expect(matchKey('Eugenio  CHACARRA')).toBe(matchKey('Eugenio Chacarra'));
    expect(matchKey('  Eugenio  CHACARRA ')).toBe('eugenio chacarra');
  });
  it('matches curly and straight apostrophes', () => {
    expect(matchKey("Timothy O\u2019Neal")).toBe(matchKey("Timothy O'Neal"));
  });
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
  it('feeds header agrees with the count: 1 needs a run, 3 need a run', () => {
    expect(feedsHeadline(0, 1).text).toBe('1 needs a run');
    expect(feedsHeadline(0, 3).text).toBe('3 need a run');
  });
  it('failures outrank the pending count, nothing pending reads All running', () => {
    expect(feedsHeadline(2, 1)).toEqual({ text: '2 failed in 24 h', tone: 'danger' });
    expect(feedsHeadline(0, 0)).toEqual({ text: 'All running', tone: 'ok' });
  });
});

import { nameTokens, isDupName, wordsMatch } from './tourDataDisplay';
describe('BRIEF_TOUR_RANKINGS_NAME_MATCH helpers', () => {
  it('strips diacritics', () => { expect(matchKey('Ludvig \u00c5berg')).toBe('ludvig aberg'); });
  it('treats hyphens as spaces', () => { expect(matchKey('Lopez-Chacarra')).toBe('lopez chacarra'); });
  it('word match ignores extra surname words', () => { expect(wordsMatch('Eugenio Chacarra', 'Eugenio Lopez-Chacarra')).toBe(true); });
  it('a single word never word-matches', () => { expect(wordsMatch('Kim', 'Tom Kim')).toBe(false); });
  it('different given names do not word-match', () => { expect(wordsMatch('Tom Kim', 'Si Woo Kim')).toBe(false); });
  it('detects hand-marked DUP rows', () => { expect(isDupName('Eugenio-DUP Chacarra-DUP')).toBe(true); });
  it('tokens split the key', () => { expect(nameTokens(' Eugenio  Lopez-Chacarra ')).toEqual(['eugenio', 'lopez', 'chacarra']); });
});
