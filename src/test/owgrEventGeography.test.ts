import { describe, expect, it } from 'vitest';
import { owgrCountryMatches, owgrGeoNote } from '@/lib/tourhub/owgrEventGeography';

describe('owgrEventGeography', () => {
  it('matches an event and course in the same ordinary country', () => {
    expect(owgrCountryMatches('France', { sub_country: 'France', country: 'Continental Europe' })).toBe(true);
  });

  it('rejects a cross-border course', () => {
    expect(owgrCountryMatches('Spain', { sub_country: 'Andorra', country: 'Continental Europe' })).toBe(false);
  });

  it('uses the USA region grouping for United States events', () => {
    expect(owgrCountryMatches('United States of America', { sub_country: 'Florida', country: 'USA' })).toBe(true);
    expect(owgrCountryMatches('usa', { sub_country: 'Florida', country: 'USA' })).toBe(true);
  });

  it('uses South Korea sub-country for Korea events', () => {
    expect(owgrCountryMatches('Republic of Korea', { sub_country: 'South Korea', country: 'Rest of World' })).toBe(true);
  });

  it('fails closed for a blank event country', () => {
    expect(owgrCountryMatches(' ', { sub_country: 'France', country: 'Continental Europe' })).toBe(false);
    expect(owgrCountryMatches(null, { sub_country: 'France', country: 'Continental Europe' })).toBe(false);
  });

  it('explains a mismatch without naming an event', () => {
    expect(owgrGeoNote('Spain', { sub_country: 'Andorra', country: 'Continental Europe' }))
      .toBe('The event is in Spain; this course is in Andorra.');
  });
});
