import { describe, expect, it } from 'vitest';
import { CONTINENT_COUNTRIES } from './countries';
import { CARIBBEAN_NATIONS } from './geography';

/**
 * CARIBBEAN_NATIONS decides the country label; CONTINENT_COUNTRIES decides what
 * can be picked. Exact string equality on purpose: accents and Saint/St matter.
 */
describe('Caribbean vocabulary', () => {
  it('every CARIBBEAN_NATIONS name is offered under North America, spelled identically', () => {
    const offered = new Set(CONTINENT_COUNTRIES['North America']);
    const missing = [...CARIBBEAN_NATIONS].filter((n) => !offered.has(n));
    expect(missing).toEqual([]);
  });
});
