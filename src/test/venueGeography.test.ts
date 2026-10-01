import { describe, expect, it } from 'vitest';
import { isVenueGeographyCompatible as ok } from '@/lib/tourhub/venueGeography';

describe('venue geography gate', () => {
  it('St. Andrews (GBR) can never match a US course', () => {
    expect(ok({ country: 'GBR' }, { sub_country: 'Iowa' })).toBe(false);
    expect(ok({ country: 'GBR' }, { sub_country: 'Scotland' })).toBe(true);
  });
  it('state beats country for same-name clubs', () => {
    expect(ok({ country: 'USA', state: 'TX' }, { sub_country: 'California' })).toBe(false);
    expect(ok({ country: 'USA', state: 'TX' }, { sub_country: 'Texas' })).toBe(true);
  });
  it('fails closed', () => {
    expect(ok({ country: 'ZZZ' }, { sub_country: 'Scotland' })).toBe(false);
    expect(ok({ country: 'GBR' }, { sub_country: null })).toBe(false);
    expect(ok({ country: null }, { sub_country: 'Texas' })).toBe(false);
    expect(ok({ country: 'USA' }, { sub_country: 'Texas' })).toBe(false);
  });
  it('Canadian province accepts Canada', () => {
    expect(ok({ country: 'CAN', state: 'AB' }, { sub_country: 'Canada' })).toBe(true);
  });
});
