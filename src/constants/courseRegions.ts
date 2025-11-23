// Primary region keys – the only valid region codes app-wide
export const PRIMARY_REGIONS = {
  ALL: 'all',
  GB_I: 'gb-i',
  EUROPE: 'europe',
  USA: 'usa',
  REST: 'rest',
} as const;

export type PrimaryRegionKey =
  typeof PRIMARY_REGIONS[keyof typeof PRIMARY_REGIONS];

// Human-friendly label for each primary region
export const PRIMARY_REGION_LABELS: Record<PrimaryRegionKey, string> = {
  'all': 'All Regions',
  'gb-i': 'Britain & Ireland',
  'europe': 'Continental Europe',
  'usa': 'USA',
  'rest': 'Rest of World',
};

// Subregion lists per primary region (single source of truth)
export const SUBREGIONS: Record<Exclude<PrimaryRegionKey, 'all'>, string[]> = {
  'gb-i': [
    'England',
    'Scotland',
    'Wales',
    'Ireland',
    'Northern Ireland',
    'Isle of Man',
  ],
  'europe': [
    'Andorra',
    'Austria',
    'Belgium',
    'Croatia',
    'Czech Republic',
    'Denmark',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Hungary',
    'Iceland',
    'Italy',
    'Netherlands',
    'Norway',
    'Poland',
    'Portugal',
    'Spain',
    'Sweden',
    'Switzerland',
    'Turkey',
  ],
  'usa': [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
  ],
  'rest': [],
};

// Normalisation helper used everywhere (search + URL <-> labels)
export function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

// Convert region key to DB primary_region value
export function regionKeyToDbValue(key: PrimaryRegionKey): string | null {
  switch (key) {
    case 'gb-i':
      return 'Britain & Ireland';
    case 'europe':
      return 'Continental Europe';
    case 'usa':
      return 'USA';
    case 'rest':
      return 'Rest of World';
    case 'all':
    default:
      return null;
  }
}

// Convert normalized subregion key back to a title-cased label
export function subregionKeyToLabel(
  regionKey: PrimaryRegionKey,
  subKey: string
): string {
  const list = SUBREGIONS[regionKey as Exclude<PrimaryRegionKey, 'all'>] || [];
  const match = list.find(
    (label) => normalizeLabel(label) === subKey
  );
  return match || subKey;
}

// Convert DB primary_region value back to region key
export function dbValueToRegionKey(dbValue?: string | null): PrimaryRegionKey {
  if (!dbValue) return PRIMARY_REGIONS.ALL;

  const value = dbValue.toLowerCase();

  if (value.includes('britain') || value.includes('ireland')) {
    return PRIMARY_REGIONS.GB_I;
  }
  if (value.includes('continental europe')) {
    return PRIMARY_REGIONS.EUROPE;
  }
  if (value === 'usa' || value.includes('united states')) {
    return PRIMARY_REGIONS.USA;
  }
  if (value.includes('rest of world')) {
    return PRIMARY_REGIONS.REST;
  }

  return PRIMARY_REGIONS.ALL;
}

// Map a primary region key to the default Top 100 list slug
export function primaryRegionKeyToTop100Slug(
  key: PrimaryRegionKey
): string | null {
  switch (key) {
    case PRIMARY_REGIONS.GB_I:
      return 'gb-i';
    case PRIMARY_REGIONS.EUROPE:
      return 'europe';
    case PRIMARY_REGIONS.USA:
      return 'usa';
    case PRIMARY_REGIONS.REST:
      return 'rest';
    case PRIMARY_REGIONS.ALL:
    default:
      return 'global';
  }
}
