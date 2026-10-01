/**
 * SportRadar venue geography <-> clbhouz course geography.
 *
 * Ben, Oct 2026. The sibling of src/lib/whs/countryVocabulary.ts, for the same
 * failure: a name match accepted across a border. A backfill promoting 'exact'
 * sr_course_map rows linked 180 tournaments and 6 venues were wrong, because
 * 'exact' only ever meant the normalised NAME matched.
 *
 * Established from live data before this was written (1 Oct 2026):
 *
 *  - `SELECT venue_country, count(*), count(venue_state) FROM sr_tournaments
 *    GROUP BY 1` gives 41 ISO3 codes over 316 tournaments. Every code below is
 *    one of those 41; this is NOT a world list. A new code from the vendor is
 *    unknown until someone adds it here, and unknown fails closed.
 *  - `venue_state` is populated on every USA row (213/213) and every CAN row
 *    (6/6) and on nothing else. So rule (a) is the primary test for 219 of 316
 *    tournaments and the country fallback covers the other 97.
 *  - US courses carry the full state name in `golf_courses.sub_country`
 *    ("Texas"), never "USA". Canadian courses carry "Canada" (provinces are
 *    not used today), so a Canadian province accepts either.
 *  - `golf_courses.country` is a REGION GROUPING ("Britain & Ireland",
 *    "Rest of World", "USA"). A check on it caught 2 of the 6 bad links.
 *    Always read `sub_country`.
 *
 * FAIL CLOSED. An ISO3 code not listed here, a missing venue country, or a
 * candidate with a null `sub_country` is incompatible. No match asks a human;
 * a wrong match shows members the wrong course. Dundonald Links and PGA Riviera
 * Maya have a null sub_country today and need manual mapping - correct, not a bug.
 */

/** ISO3 `venue_country` -> clbhouz `sub_country` values it may match (non-state rows). */
export const VENUE_COUNTRY_TO_SUB_COUNTRIES: Record<string, readonly string[]> = {
  ARE: ['United Arab Emirates'],
  ARG: ['Argentina'],
  AUS: ['Australia'],
  AUT: ['Austria'],
  BEL: ['Belgium'],
  BHR: ['Bahrain'],
  BHS: ['Bahamas'],
  BMU: ['Bermuda'],
  CAN: ['Canada'],
  CHE: ['Switzerland'],
  CHL: ['Chile'],
  CHN: ['China'],
  COL: ['Colombia'],
  DEU: ['Germany'],
  DNK: ['Denmark'],
  DOM: ['Dominican Republic'],
  ESP: ['Spain'],
  FRA: ['France'],
  // The vendor files the home nations as one country.
  GBR: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  HKG: ['Hong Kong'],
  IND: ['India'],
  // The Irish Open has visited Northern Ireland (Portrush, Galgorm).
  IRL: ['Ireland', 'Northern Ireland'],
  ITA: ['Italy'],
  JPN: ['Japan'],
  KEN: ['Kenya'],
  KOR: ['South Korea'],
  MAR: ['Morocco'],
  MEX: ['Mexico'],
  MUS: ['Mauritius'],
  MYS: ['Malaysia'],
  NLD: ['Netherlands'],
  PAN: ['Panama'],
  PRI: ['Puerto Rico'],
  PRT: ['Portugal'],
  QAT: ['Qatar'],
  SAU: ['Saudi Arabia'],
  SGP: ['Singapore'],
  THA: ['Thailand'],
  TUR: ['Turkey'],
  USA: [], // USA rows always carry a state; see US_STATES.
  ZAF: ['South Africa'],
};

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

const CA_PROVINCES: Record<string, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', ON: 'Ontario',
  PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan',
};

export interface VenueGeo {
  country: string | null | undefined; // ISO3
  state?: string | null | undefined;
}

export interface CourseGeo {
  sub_country: string | null | undefined;
}

/** The sub_country values this venue may legitimately match. Empty = fail closed. */
export function allowedVenueSubCountries(venue: VenueGeo): readonly string[] {
  const iso = venue.country?.trim().toUpperCase();
  if (!iso || !(iso in VENUE_COUNTRY_TO_SUB_COUNTRIES)) return [];
  const st = venue.state?.trim().toUpperCase();
  // Rule (a): a state, when present, is the test - it alone separates the
  // same-name clubs in different states that every country check passes.
  if (st) {
    if (iso === 'USA') return US_STATES[st] ? [US_STATES[st]] : [];
    if (iso === 'CAN') return CA_PROVINCES[st] ? [CA_PROVINCES[st], 'Canada'] : ['Canada'];
  }
  // Rule (b): country through the vocabulary. USA without a state -> [] -> closed.
  return VENUE_COUNTRY_TO_SUB_COUNTRIES[iso];
}

/** The one predicate. Reads sub_country, never the country grouping. */
export function isVenueGeographyCompatible(venue: VenueGeo, course: CourseGeo): boolean {
  const sub = course.sub_country?.trim().toLowerCase();
  if (!sub) return false;
  return allowedVenueSubCountries(venue).some((a) => a.toLowerCase() === sub);
}

/** Human-readable venue place ("Fort Worth, TX, USA"). */
export function venueGeoLabel(v: VenueGeo & { city?: string | null }): string {
  return [v.city, v.state, v.country].filter(Boolean).join(', ') || 'no recorded place';
}

/** Disagreement for the admin surface. Null when compatible. */
export function venueGeographyNote(venue: VenueGeo, course: CourseGeo): string | null {
  if (isVenueGeographyCompatible(venue, course)) return null;
  const allowed = allowedVenueSubCountries(venue);
  const where = course.sub_country ?? 'no recorded country';
  if (allowed.length === 0) {
    return `Venue place "${venueGeoLabel(venue)}" is not in the venue vocabulary, so it cannot be checked against ${where}.`;
  }
  return `The venue is in ${allowed.join(' / ')}; this course is in ${where}.`;
}
