// Primary region keys – the only valid region codes app-wide
export const PRIMARY_REGIONS = {
  ALL: 'all',
  GB_I: 'gb-i',
  EUROPE: 'europe',
  USA: 'usa',
  AFRICA: 'africa',
  ASIA: 'asia',
  MIDDLE_EAST: 'middle-east',
  OCEANIA: 'oceania',
  CARIBBEAN: 'caribbean',
  CENTRAL_SOUTH_AMERICA: 'central-south-america',
  REST: 'rest',
} as const;

export type PrimaryRegionKey =
  typeof PRIMARY_REGIONS[keyof typeof PRIMARY_REGIONS];

// Human-friendly label for each primary region
export const PRIMARY_REGION_LABELS: Record<PrimaryRegionKey, string> = {
  'all': 'All Regions',
  'gb-i': 'GB&I',
  'usa': 'USA',
  'europe': 'Continental Europe',
  'asia': 'Asia',
  'middle-east': 'Middle East',
  'oceania': 'Oceania',
  'caribbean': 'Caribbean',
  'central-south-america': 'Central & South America',
  'africa': 'Africa',
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
  'africa': [
    'Algeria',
    'Angola',
    'Benin',
    'Botswana',
    'Burkina Faso',
    'Burundi',
    'Cameroon',
    'Cape Verde',
    'Central African Republic',
    'Chad',
    'Democratic Republic of Congo',
    'Djibouti',
    'Egypt',
    'Ethiopia',
    'Gabon',
    'Gambia',
    'Ghana',
    'Ivory Coast',
    'Kenya',
    'Lesotho',
    'Libya',
    'Madagascar',
    'Malawi',
    'Mauritius',
    'Mayotte',
    'Morocco',
    'Mozambique',
    'Namibia',
    'Nigeria',
    'Rwanda',
    'Saint Helena, Ascension, Tristan Dukana',
    'Senegal',
    'Seychelles',
    'Sierra Leone',
    'South Africa',
    'Sudan',
    'Swaziland',
    'Tanzania',
    'Togo',
    'Tunisia',
    'Uganda',
    'Zambia',
    'Zimbabwe',
  ],
  'asia': [
    'Afghanistan',
    'Armenia',
    'Azerbaijan',
    'Bangladesh',
    'Bhutan',
    'Brunei',
    'Cambodia',
    'China',
    'Georgia',
    'Hong Kong',
    'India',
    'Indonesia',
    'Japan',
    'Kazakhstan',
    'Kyrgyzstan',
    'Laos',
    'Malaysia',
    'Mongolia',
    'Myanmar',
    'Nepal',
    'North Korea',
    'Pakistan',
    'Philippines',
    'Singapore',
    'South Korea',
    'Sri Lanka',
    'Taiwan',
    'Thailand',
    'Uzbekistan',
    'Vietnam',
  ],
  'middle-east': [
    'Bahrain',
    'Iran',
    'Israel',
    'Jordan',
    'Kuwait',
    'Lebanon',
    'Oman',
    'Qatar',
    'Saudi Arabia',
    'United Arab Emirates',
  ],
  'oceania': [
    'Australia',
    'Cook Islands',
    'Fiji',
    'French Polynesia',
    'Guam',
    'New Caledonia',
    'New Zealand',
    'Norfolk Island',
    'Northern Mariana Islands',
    'Papua New Guinea',
    'Samoa',
    'Vanuatu',
  ],
  'caribbean': [
    'Anguilla',
    'Antigua and Barbuda',
    'Aruba',
    'Bahamas',
    'Barbados',
    'Cayman Islands',
    'Cuba',
    'Curaçao',
    'Dominican Republic',
    'Grenada',
    'Guadeloupe',
    'Haiti',
    'Jamaica',
    'Martinique',
    'Puerto Rico',
    'St Kitts and Nevis',
    'St Lucia',
    'St Martin',
    'St Vincent and the Grenadines',
    'Trinidad and Tobago',
    'Turks and Caicos Islands',
    'Virgin Islands',
  ],
  'central-south-america': [
    'Argentina',
    'Belize',
    'Bolivia',
    'Brazil',
    'Chile',
    'Colombia',
    'Costa Rica',
    'Ecuador',
    'El Salvador',
    'Falkland Islands',
    'French Guiana',
    'Guatemala',
    'Guyana',
    'Honduras',
    'Nicaragua',
    'Panama',
    'Paraguay',
    'Peru',
    'Suriname',
    'Uruguay',
    'Venezuela',
  ],
  'rest': [],
};

// Normalisation helper used everywhere (search + URL <-> labels)
export function normalizeLabel(label: string | undefined | null): string {
  if (!label || typeof label !== 'string') return '';
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
    case 'africa':
      return 'Africa';
    case 'asia':
      return 'Asia';
    case 'middle-east':
      return 'Middle East';
    case 'oceania':
      return 'Oceania';
    case 'caribbean':
      return 'Caribbean';
    case 'central-south-america':
      return 'Central and South America';
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

  if (value.includes('britain') || value.includes('ireland') || value.includes('united kingdom') || value === 'uk') {
    return PRIMARY_REGIONS.GB_I;
  }
  if (value.includes('continental europe')) {
    return PRIMARY_REGIONS.EUROPE;
  }
  if (value === 'usa' || value.includes('united states')) {
    return PRIMARY_REGIONS.USA;
  }
  if (value === 'africa') {
    return PRIMARY_REGIONS.AFRICA;
  }
  if (value === 'asia') {
    return PRIMARY_REGIONS.ASIA;
  }
  if (value.includes('middle east')) {
    return PRIMARY_REGIONS.MIDDLE_EAST;
  }
  if (value === 'oceania') {
    return PRIMARY_REGIONS.OCEANIA;
  }
  if (value === 'caribbean') {
    return PRIMARY_REGIONS.CARIBBEAN;
  }
  if (value.includes('central') && value.includes('south') && value.includes('america')) {
    return PRIMARY_REGIONS.CENTRAL_SOUTH_AMERICA;
  }
  if (value.includes('rest of world')) {
    return PRIMARY_REGIONS.REST;
  }

  return PRIMARY_REGIONS.ALL;
}

// Derive the parent region from a subregion name (e.g., "Northern Ireland" -> "gb-i")
export function getRegionFromSubregion(subCountry: string | undefined | null): PrimaryRegionKey | null {
  // Safety guards
  if (!subCountry || typeof subCountry !== 'string' || subCountry.trim() === '') {
    return null;
  }

  const normalizedSub = normalizeLabel(subCountry);
  
  for (const [regionKey, subList] of Object.entries(SUBREGIONS)) {
    if (subList.some(sub => normalizeLabel(sub) === normalizedSub)) {
      return regionKey as PrimaryRegionKey;
    }
  }
  return null;
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
    case PRIMARY_REGIONS.AFRICA:
      return 'africa';
    case PRIMARY_REGIONS.ASIA:
      return 'asia';
    case PRIMARY_REGIONS.MIDDLE_EAST:
      return 'middle-east';
    case PRIMARY_REGIONS.OCEANIA:
      return 'oceania';
    case PRIMARY_REGIONS.CARIBBEAN:
      return 'caribbean';
    case PRIMARY_REGIONS.CENTRAL_SOUTH_AMERICA:
      return 'central-south-america';
    case PRIMARY_REGIONS.REST:
      return 'rest';
    case PRIMARY_REGIONS.ALL:
    default:
      return 'global';
  }
}
