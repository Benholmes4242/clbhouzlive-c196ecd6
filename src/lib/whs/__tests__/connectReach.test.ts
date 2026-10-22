import { describe, expect, it } from 'vitest';
import { connectReach, joinNames } from '../connectReach';
import { WHS_COUNTRIES } from '../whsCountries';

describe('shared connect reach', () => {
  it('names England as live with the real country catalogue', () => {
    expect(connectReach().live).toBe('England');
  });

  it('counts every unsupported country from the catalogue', () => {
    expect(connectReach().count).toBe(WHS_COUNTRIES.filter((c) => !c.supported).length);
  });

  it.each([
    [[], ''],
    [['A'], 'A'],
    [['A', 'B'], 'A and B'],
    [['A', 'B', 'C'], 'A, B and C'],
  ] as [string[], string][])('joins %j as %s', (names, expected) => {
    expect(joinNames(names)).toBe(expected);
  });
});