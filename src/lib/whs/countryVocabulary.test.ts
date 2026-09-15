import { describe, expect, it } from 'vitest';
import {
  allowedSubCountries,
  countryMismatchNote,
  isCountryCompatible,
  makeCountryGate,
  whsCountryNameFromCode,
} from './countryVocabulary';

/**
 * The fourteen live cross-country links measured 15 Sep 2026
 * (docs/ops/whs-cross-country-mismatch-worksheet.md). Every one must be rejected.
 */
const KNOWN_BAD: Array<[string, string, string, string]> = [
  ['Tournament Course', 'England', 'The Tournament Course at the The Woodlands Country Club', 'Texas'],
  ['Ocean Golf Course', 'Portugal', "Prince's Golf Club (Shore, Dunes & Himalayas)", 'England'],
  ['Centurion Club', 'England', 'Centurion Country Club', 'South Africa'],
  ['Marlborough', 'England', 'Marlborough Country Club', 'Massachusetts'],
  ['The Belfry Club-PGA National', 'England', 'Beloit Club', 'Wisconsin'],
  ['The Belfry Club-The Brabazon', 'England', 'Beloit Club', 'Wisconsin'],
  ['Burhill-Old Course', 'England', 'Old Mill Golf Course', 'Utah'],
  ['The Els Club', 'Portugal', 'The Els Club', 'United Arab Emirates'],
  ['Ballyliffin-Old Course', 'Ireland', 'Old Baldy Golf Course', 'Montana'],
  ['Dunas Golf Course', 'Portugal', 'Dunas Clube de Pelotas', 'Brazil'],
  ['El Paraiso', 'Spain', 'El Paraiso Country Club', 'Argentina'],
  ['Hillside', 'England', 'Hillside Links', 'Connecticut'],
  ['Les Dunes', 'France', 'Les Dunes Golf Club', 'Morocco'],
  ['St Andrews New Course', 'Scotland', 'St. Andrews Golf Course', 'Kansas'],
];

/** The four legitimate Ireland -> Northern Ireland mappings. */
const IRELAND_NI: Array<[string, string]> = [
  ['Royal Portrush', 'Northern Ireland'],
  ['Portstewart', 'Northern Ireland'],
  ['Royal County Down', 'Northern Ireland'],
  ['Royal County Down (Annesley Links)', 'Northern Ireland'],
];

describe('country vocabulary', () => {
  it('rejects all fourteen known-bad pairs', () => {
    for (const [whsName, whsCountry, target, targetSub] of KNOWN_BAD) {
      expect(
        isCountryCompatible(whsCountry, targetSub),
        `${whsName} (${whsCountry}) -> ${target} (${targetSub}) must be rejected`,
      ).toBe(false);
      expect(countryMismatchNote(whsCountry, targetSub)).toBeTruthy();
    }
  });

  it('accepts the four Ireland / Northern Ireland pairs', () => {
    for (const [name, sub] of IRELAND_NI) {
      expect(isCountryCompatible('Ireland', sub), `${name} must be accepted`).toBe(true);
      expect(countryMismatchNote('Ireland', sub)).toBeNull();
    }
    // and plain Ireland still works
    expect(isCountryCompatible('Ireland', 'Ireland')).toBe(true);
  });

  it('accepts the straight one-to-one pairs', () => {
    for (const c of ['England', 'Scotland', 'Wales', 'Portugal', 'Spain', 'France', 'Greece', 'Italy', 'Mexico']) {
      expect(isCountryCompatible(c, c)).toBe(true);
    }
  });

  it('fails closed on an unknown WHS country and on a null sub_country', () => {
    expect(isCountryCompatible('Narnia', 'England')).toBe(false);
    expect(allowedSubCountries('Narnia')).toHaveLength(0);
    expect(isCountryCompatible('England', null)).toBe(false);
    const gate = makeCountryGate('Narnia');
    expect(gate.active).toBe(true);
    expect(gate.allows('England')).toBe(false);
  });

  it('never reads the region grouping: Mexico is not matched by a grouping value', () => {
    expect(isCountryCompatible('Mexico', 'Mexico')).toBe(true);
    expect(isCountryCompatible('Mexico', 'Rest of World')).toBe(false);
    expect(isCountryCompatible('England', 'Britain & Ireland')).toBe(false);
  });

  it('bridges the three legacy code schemes but is built on the name', () => {
    expect(whsCountryNameFromCode('ENG')).toBe('England');
    expect(whsCountryNameFromCode('GB-SCT')).toBe('Scotland');
    expect(whsCountryNameFromCode('PT')).toBe('Portugal');
    expect(whsCountryNameFromCode('ZZ')).toBeNull();
  });

  it('is inert when no country is supplied at all', () => {
    const gate = makeCountryGate(null);
    expect(gate.active).toBe(false);
    expect(gate.allows('Texas')).toBe(true);
  });
});
