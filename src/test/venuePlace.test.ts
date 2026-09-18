import { describe, expect, it } from 'vitest';
import { resolveVenuePlace } from '@/features/tourhub/leaderboard/venuePlace';

describe('resolveVenuePlace', () => {
  it.each([
    ['Virginia Water', 'GBR', null, 'England', 'Virginia Water, England'],
    ['Aberdeen', 'GBR', null, 'Scotland', 'Aberdeen, Scotland'],
    ['Sutton Coldfield', 'GBR', null, null, 'Sutton Coldfield, United Kingdom'],
    ['Arden', 'USA', 'NC', 'North Carolina', 'Arden, North Carolina'],
    ['Atlanta', 'USA', 'GA', null, 'Atlanta, Georgia'],
    ['Edmonton', 'CAN', 'AB', 'Ohio', 'Edmonton, Canada'],
    ['Calgary', 'CAN', 'AB', null, 'Calgary, Canada'],
    ['Clare', 'IRL', null, null, 'Clare, Ireland'],
    ['Dubai', 'ARE', null, null, 'Dubai, United Arab Emirates'],
  ])('resolves %s without leaking raw codes', (city, countryCode, stateCode, courseSubCountry, expected) => {
    expect(resolveVenuePlace({ city, countryCode, stateCode, courseSubCountry })).toBe(expected);
  });

  it('fails closed for an unknown country code', () => {
    expect(resolveVenuePlace({ city: 'Somewhere', countryCode: 'ZZZ' })).toBe('Somewhere');
    expect(resolveVenuePlace({ countryCode: 'ZZZ' })).toBeNull();
  });

  it('falls back to United States for an unknown or absent state', () => {
    expect(resolveVenuePlace({ city: 'Test', countryCode: 'USA', stateCode: 'XX' })).toBe('Test, United States');
    expect(resolveVenuePlace({ city: 'Test', countryCode: 'USA' })).toBe('Test, United States');
  });

  it('contains every US state plus the District of Columbia', () => {
    const codes = [
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
      'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
      'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
    ];
    for (const stateCode of codes) {
      expect(resolveVenuePlace({ city: 'Test', countryCode: 'USA', stateCode })).not.toBe('Test, United States');
    }
  });
});