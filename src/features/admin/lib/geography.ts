/**
 * Admin course geography model.
 *
 * The verified data convention in golf_courses (5,790 rows) is:
 *
 *   continent    real continent            'Europe'
 *   country      REGION GROUPING           'Britain & Ireland'
 *   region_key   grouping code             'GBI'
 *   sub_country  country or home nation    'England' / 'Spain' / 'Indiana'
 *   region       county / state / province 'Kent'
 *
 * country is NOT a country. Only four region_key values exist:
 * GBI, EU, USA, ROW.
 *
 * Admins never type any of continent / country / region_key: they pick a
 * grouping and (for Rest of World) a continent, and this module derives the
 * stored triple.
 */

import { CONTINENT_COUNTRIES } from './countries';

export type RegionKey = 'GBI' | 'EU' | 'USA' | 'ROW';

/** Continents offered under the Rest of World grouping. */
export const ROW_CONTINENTS = [
  'Africa',
  'Asia',
  'Oceania',
  'South America',
  'North America',
] as const;

export type RowContinent = (typeof ROW_CONTINENTS)[number];

/**
 * Grouping -> (country, region_key, continent) mapping, as implemented.
 *
 *   Britain & Ireland   -> country 'Britain & Ireland',   region_key 'GBI', continent 'Europe'
 *   Continental Europe  -> country 'Continental Europe',  region_key 'EU',  continent 'Europe'
 *   USA                 -> country 'USA',                 region_key 'USA', continent 'North America'
 *   Rest of World       -> region_key 'ROW', continent chosen by the admin,
 *                          country = legacy label for that continent:
 *                            Africa        -> 'Africa'
 *                            Asia          -> 'Asia'
 *                            Oceania       -> 'Oceania'
 *                            South America -> 'Central and South America'
 *                            North America -> 'Caribbean'
 */
export const ROW_CONTINENT_COUNTRY: Record<RowContinent, string> = {
  'Africa': 'Africa',
  'Asia': 'Asia',
  'Oceania': 'Oceania',
  'South America': 'Central and South America',
  'North America': 'Caribbean',
};

/**
 * Caribbean island nations already present in the catalogue (122 ROW /
 * North America rows). Spellings match the stored data exactly - note
 * 'Curacao' (no cedilla) and the unqualified 'Virgin Islands'.
 */
export const CARIBBEAN_NATIONS = new Set<string>([
  'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados',
  'Cayman Islands', 'Cuba', 'Curacao', 'Dominica', 'Dominican Republic',
  'Grenada', 'Guadeloupe', 'Haiti', 'Jamaica', 'Martinique', 'Montserrat',
  'Puerto Rico', 'St Kitts and Nevis', 'St Lucia', 'St Martin',
  'St Vincent and the Grenadines', 'Trinidad and Tobago',
  'Turks and Caicos', 'Virgin Islands',
]);

export interface GroupingOption {
  key: RegionKey;
  label: string;
  /** Fixed country label; null when it depends on the chosen continent (ROW). */
  country: string | null;
  /** Fixed continent; null when the admin must choose (ROW). */
  continent: string | null;
}

export const GROUPINGS: GroupingOption[] = [
  { key: 'GBI', label: 'Britain & Ireland', country: 'Britain & Ireland', continent: 'Europe' },
  { key: 'EU', label: 'Continental Europe', country: 'Continental Europe', continent: 'Europe' },
  { key: 'USA', label: 'USA', country: 'USA', continent: 'North America' },
  { key: 'ROW', label: 'Rest of World', country: null, continent: null },
];

/** Legacy broad labels that live in the country column and must never be offered as a sub_country. */
export const LEGACY_COUNTRY_LABELS = [
  'Britain & Ireland', 'Continental Europe', 'USA', 'Rest of World',
  'Africa', 'Asia', 'Middle East', 'Oceania',
  'Caribbean', 'Central and South America',
];

/** GB&I home nations / crown dependencies -> sub_country options. */
export const GBI_SUB_COUNTRIES = [
  'England', 'Scotland', 'Wales', 'Northern Ireland',
  'Ireland', 'Isle of Man', 'Channel Islands',
];

/** US states + DC -> sub_country options. */
export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

function cleanList(list: string[], extraExclusions: string[] = []): string[] {
  const drop = new Set([...LEGACY_COUNTRY_LABELS, ...extraExclusions]);
  return list.filter((c) => !drop.has(c)).sort((a, b) => a.localeCompare(b));
}

/** Continental Europe: Europe list minus home nations and minus legacy labels. */
export const EU_SUB_COUNTRIES = cleanList(
  CONTINENT_COUNTRIES['Europe'] ?? [],
  [...GBI_SUB_COUNTRIES, 'United Kingdom'],
);

/** Countries for a Rest of World continent (legacy labels and USA removed). */
export function rowSubCountries(continent: string): string[] {
  const list = CONTINENT_COUNTRIES[continent];
  if (!list) return [];
  return cleanList(list, continent === 'North America' ? ['USA'] : []);
}

/** sub_country options for a grouping (+ continent when the grouping is ROW). */
export function subCountryOptions(regionKey: RegionKey | '', continent: string): string[] {
  if (regionKey === 'GBI') return [...GBI_SUB_COUNTRIES];
  if (regionKey === 'EU') return EU_SUB_COUNTRIES;
  if (regionKey === 'USA') return [...US_STATES];
  if (regionKey === 'ROW') return continent ? rowSubCountries(continent) : [];
  return [];
}

export interface DerivedGeography {
  country: string;
  region_key: RegionKey;
  continent: string;
}

/** Derive the stored (country, region_key, continent) triple from the cascade. */
export function deriveGeography(
  regionKey: RegionKey,
  rowContinent?: string,
  subCountry?: string,
): DerivedGeography | null {
  const g = GROUPINGS.find((x) => x.key === regionKey);
  if (!g) return null;
  if (regionKey === 'ROW') {
    if (!rowContinent) return null;
    // North America under ROW covers both the Caribbean islands and
    // Canada / Mexico - derive from the chosen sub_country.
    if (rowContinent === 'North America') {
      const sub = (subCountry ?? '').trim();
      const country = sub && CARIBBEAN_NATIONS.has(sub) ? 'Caribbean' : 'Rest of World';
      return { country, region_key: 'ROW', continent: rowContinent };
    }
    const country = ROW_CONTINENT_COUNTRY[rowContinent as RowContinent];
    if (!country) return null;
    return { country, region_key: 'ROW', continent: rowContinent };
  }
  return { country: g.country as string, region_key: regionKey, continent: g.continent as string };
}

/** Reverse map: recognise an existing row's country as one of the four groupings. */
export function regionKeyForCountry(country: string | null | undefined): RegionKey | null {
  const c = (country ?? '').trim();
  if (!c) return null;
  const direct = GROUPINGS.find((g) => g.country && g.country === c);
  if (direct) return direct.key;
  const rowMatch = (Object.keys(ROW_CONTINENT_COUNTRY) as RowContinent[])
    .find((k) => ROW_CONTINENT_COUNTRY[k] === c);
  if (rowMatch) return 'ROW';
  if (c === 'Rest of World') return 'ROW';
  return null;
}

/** True when the stored country is a recognised grouping label. */
export function isCanonicalCountry(country: string | null | undefined): boolean {
  return regionKeyForCountry(country) !== null;
}

/** Trim helper: '' / whitespace-only -> null. */
export function trimOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return v == null ? null : (v as any);
  const s = v.trim();
  return s === '' ? null : s;
}

/** "sub_country, country" label used by every course picker. */
export function courseLocationLabel(
  c: { sub_country?: string | null; country?: string | null },
): string {
  const parts = [c.sub_country, c.country]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  return parts.join(', ');
}

/** "region, sub_country, country" - used where same-name courses must be told apart. */
export function courseMatchLabel(
  c: { region?: string | null; sub_country?: string | null; country?: string | null },
): string {
  const parts = [c.region, c.sub_country, c.country]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  return parts.join(', ');
}
