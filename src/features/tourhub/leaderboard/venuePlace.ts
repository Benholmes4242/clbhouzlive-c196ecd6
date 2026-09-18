/**
 * LEADERBOARD VENUE PLACE — a fail-closed display resolver.
 *
 * The linked course is consulted only for GBR and IRL, where sub_country adds
 * information the tournament country code cannot express. Other joins can be
 * stale or wrong, so they never override the tournament's own country. USA
 * alone expands venue_state; every other known ISO-3 code becomes a nation.
 * Unknown values are omitted rather than leaking a raw code into the masthead.
 */

const COUNTRY_NAME_BY_ISO3: Readonly<Record<string, string>> = {
  USA: 'United States', GBR: 'United Kingdom', MEX: 'Mexico', ARE: 'United Arab Emirates',
  ZAF: 'South Africa', CHN: 'China', KOR: 'South Korea', JPN: 'Japan', BHS: 'Bahamas',
  ESP: 'Spain', AUS: 'Australia', IND: 'India', FRA: 'France', CAN: 'Canada',
  SGP: 'Singapore', NLD: 'Netherlands', BMU: 'Bermuda', MYS: 'Malaysia',
  DOM: 'Dominican Republic', MUS: 'Mauritius', BHR: 'Bahrain', CHE: 'Switzerland',
  PRT: 'Portugal', HKG: 'Hong Kong', IRL: 'Ireland', BEL: 'Belgium',
  PRI: 'Puerto Rico', PAN: 'Panama', ITA: 'Italy', SAU: 'Saudi Arabia',
  THA: 'Thailand', KEN: 'Kenya', AUT: 'Austria', COL: 'Colombia', DNK: 'Denmark',
  ARG: 'Argentina', QAT: 'Qatar', TUR: 'Turkey', DEU: 'Germany', MAR: 'Morocco',
  CHL: 'Chile',
};

const US_STATE_NAME_BY_CODE: Readonly<Record<string, string>> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

export interface VenuePlaceInput {
  city?: string | null;
  countryCode?: string | null;
  stateCode?: string | null;
  courseSubCountry?: string | null;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveVenuePlace(input: VenuePlaceInput): string | null {
  const city = clean(input.city);
  const countryCode = clean(input.countryCode)?.toUpperCase() ?? null;
  const stateCode = clean(input.stateCode)?.toUpperCase() ?? null;
  const courseSubCountry = clean(input.courseSubCountry);

  let place: string | null = null;
  if (countryCode === 'GBR' || countryCode === 'IRL') {
    place = courseSubCountry ?? COUNTRY_NAME_BY_ISO3[countryCode] ?? null;
  } else if (countryCode === 'USA') {
    place = (stateCode ? US_STATE_NAME_BY_CODE[stateCode] : null) ?? COUNTRY_NAME_BY_ISO3.USA;
  } else if (countryCode) {
    place = COUNTRY_NAME_BY_ISO3[countryCode] ?? null;
  }

  if (city && place) return `${city}, ${place}`;
  return city ?? place;
}
