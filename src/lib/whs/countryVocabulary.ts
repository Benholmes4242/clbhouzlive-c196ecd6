/**
 * WHS country vocabulary <-> clbhouz course geography.
 *
 * Ben, Sep 2026. Established from live data before this was written:
 *
 *  - `whs_courses` carries `country_name` on every row (10 distinct values today).
 *  - `whs_courses.country_code` mixes three schemes (ENG and WAL are IOC-style,
 *    GB-SCT is a subdivision code, the rest ISO-2), so the vocabulary is built on
 *    `country_name`. The code is only a legacy bridge for callers that still pass it.
 *  - `golf_courses.country` is a REGION GROUPING ("Britain & Ireland",
 *    "Continental Europe", "Rest of World"), NOT a country. Mexico sits under
 *    "Rest of World", so a check on that column would pass a Mexican WHS course
 *    against anything in Asia. Always read `sub_country`.
 *  - England Golf publishes Royal Portrush, Portstewart and Royal County Down with
 *    country_name 'Ireland' while the clbhouz rows carry sub_country
 *    'Northern Ireland'. That divergence is legitimate and explicit below; a strict
 *    equality check would reject four correct mappings.
 *
 * FAIL CLOSED. An unknown WHS country name rejects every candidate, and a candidate
 * with a null `sub_country` is rejected. No match asks a human; a wrong match invites
 * a member to rate a course on another continent.
 */

/** WHS `country_name` -> the clbhouz `sub_country` values it may legitimately match. */
export const WHS_COUNTRY_TO_SUB_COUNTRIES: Record<string, readonly string[]> = {
  England: ['England'],
  Scotland: ['Scotland'],
  Wales: ['Wales'],
  // The one legitimate divergence: the governing body publishes Northern Irish
  // courses under 'Ireland'.
  Ireland: ['Ireland', 'Northern Ireland'],
  Portugal: ['Portugal'],
  Spain: ['Spain'],
  France: ['France'],
  Greece: ['Greece'],
  Italy: ['Italy'],
  Mexico: ['Mexico'],
};

/**
 * Legacy bridge only: the ten `country_code` values seen in `whs_courses` today.
 * New code should pass `country_name`. Anything not listed resolves to null, which
 * makes the gate fail closed rather than guess.
 */
const WHS_CODE_TO_COUNTRY_NAME: Record<string, string> = {
  ENG: 'England',
  'GB-ENG': 'England',
  'GB-SCT': 'Scotland',
  SCO: 'Scotland',
  WAL: 'Wales',
  'GB-WLS': 'Wales',
  IE: 'Ireland',
  IRL: 'Ireland',
  PT: 'Portugal',
  ES: 'Spain',
  FR: 'France',
  GR: 'Greece',
  IT: 'Italy',
  MX: 'Mexico',
};

export function whsCountryNameFromCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return WHS_CODE_TO_COUNTRY_NAME[code.trim().toUpperCase()] ?? null;
}

/** Case-insensitive lookup of the WHS country name in the vocabulary. */
function vocabKey(whsCountryName: string): string | null {
  const wanted = whsCountryName.trim().toLowerCase();
  for (const key of Object.keys(WHS_COUNTRY_TO_SUB_COUNTRIES)) {
    if (key.toLowerCase() === wanted) return key;
  }
  return null;
}

/**
 * The clbhouz `sub_country` values a WHS course from this country may match.
 * Empty array = unknown WHS country, which rejects everything (fail closed).
 */
export function allowedSubCountries(whsCountryName: string | null | undefined): readonly string[] {
  if (!whsCountryName) return [];
  const key = vocabKey(whsCountryName);
  return key ? WHS_COUNTRY_TO_SUB_COUNTRIES[key] : [];
}

/** True when a candidate course's `sub_country` is compatible with the WHS country. */
export function isCountryCompatible(
  whsCountryName: string | null | undefined,
  candidateSubCountry: string | null | undefined,
): boolean {
  if (!candidateSubCountry) return false; // null sub_country cannot be verified
  const allowed = allowedSubCountries(whsCountryName);
  if (allowed.length === 0) return false; // unknown WHS country
  const sub = candidateSubCountry.trim().toLowerCase();
  return allowed.some((a) => a.toLowerCase() === sub);
}

/**
 * A country gate for one WHS course.
 *
 * `active: false` means no country was supplied at all, so the gate cannot run and
 * legacy behaviour is preserved (cosmetic thumbnail lookups call the matcher without
 * a country). A SUPPLIED but unrecognised country is active with an empty allow-list,
 * i.e. it rejects.
 */
export interface CountryGate {
  active: boolean;
  whsCountryName: string | null;
  allowed: readonly string[];
  /** Rejects when the gate is active and the candidate is not compatible. */
  allows(candidateSubCountry: string | null | undefined): boolean;
}

export function makeCountryGate(whsCountryName: string | null | undefined): CountryGate {
  const name = whsCountryName?.trim() || null;
  const allowed = allowedSubCountries(name);
  return {
    active: name !== null,
    whsCountryName: name,
    allowed,
    allows(candidateSubCountry) {
      if (name === null) return true;
      return isCountryCompatible(name, candidateSubCountry);
    },
  };
}

/**
 * Human-readable disagreement for the admin review screens. Null when the pair is
 * compatible (or when there is nothing to compare).
 */
export function countryMismatchNote(
  whsCountryName: string | null | undefined,
  candidateSubCountry: string | null | undefined,
): string | null {
  if (!whsCountryName) return null;
  if (isCountryCompatible(whsCountryName, candidateSubCountry)) return null;
  const allowed = allowedSubCountries(whsCountryName);
  if (allowed.length === 0) {
    return `WHS country "${whsCountryName}" is not in the country vocabulary, so it cannot be checked against ${candidateSubCountry ?? 'an unknown country'}.`;
  }
  return `WHS says ${whsCountryName}; this course is in ${candidateSubCountry ?? 'no recorded country'}.`;
}
