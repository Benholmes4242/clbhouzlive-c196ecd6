
// Map country names to ISO country codes for flag display
// Includes both uppercase (SportRadar format) and title case variants
export const countryToFlagCode: Record<string, string> = {
  // United States variants
  'USA': 'US',
  'UNITED STATES': 'US',
  'United States': 'US',
  'UNITED STATES OF AMERICA': 'US',
  'United States of America': 'US',
  
  // UK and constituent countries
  'Britain & Ireland': 'GB',
  'Continental Europe': 'EU',
  'ENGLAND': 'GB-ENG',
  'England': 'GB-ENG',
  'GREAT BRITAIN': 'GB',
  'Great Britain': 'GB',
  'UNITED KINGDOM': 'GB',
  'United Kingdom': 'GB',
  'UK': 'GB',
  
  'SCOTLAND': 'GB-SCT',
  'Scotland': 'GB-SCT',
  
  'WALES': 'GB-WLS',
  'Wales': 'GB-WLS',
  
  // Northern Ireland is a nationality distinct from both Ireland and the UK in
  // sr_players.country, exactly as the golf bodies record it. GB-NIR is the only
  // mark that denotes what the data says — no Union Flag, no tricolour. Treated
  // exactly like the other three home nations, with no special-case branch.
  'NORTHERN IRELAND': 'GB-NIR',
  'Northern Ireland': 'GB-NIR',
  
  'IRELAND': 'IE',
  'Ireland': 'IE',
  
  // Western Europe
  'FRANCE': 'FR',
  'France': 'FR',
  'GERMANY': 'DE',
  'Germany': 'DE',
  'SPAIN': 'ES',
  'Spain': 'ES',
  'ITALY': 'IT',
  'Italy': 'IT',
  'PORTUGAL': 'PT',
  'Portugal': 'PT',
  'NETHERLANDS': 'NL',
  'Netherlands': 'NL',
  'BELGIUM': 'BE',
  'Belgium': 'BE',
  'SWITZERLAND': 'CH',
  'Switzerland': 'CH',
  'AUSTRIA': 'AT',
  'Austria': 'AT',
  
  // Scandinavia
  'DENMARK': 'DK',
  'Denmark': 'DK',
  'SWEDEN': 'SE',
  'Sweden': 'SE',
  'NORWAY': 'NO',
  'Norway': 'NO',
  'FINLAND': 'FI',
  'Finland': 'FI',
  
  // Asia Pacific
  'AUSTRALIA': 'AU',
  'Australia': 'AU',
  'NEW ZEALAND': 'NZ',
  'New Zealand': 'NZ',
  'JAPAN': 'JP',
  'Japan': 'JP',
  'SOUTH KOREA': 'KR',
  'South Korea': 'KR',
  'KOREA': 'KR',
  'Korea': 'KR',
  'CHINA': 'CN',
  'China': 'CN',
  'CHINESE TAIPEI': 'TW',
  'Chinese Taipei': 'TW',
  'TAIWAN': 'TW',
  'Taiwan': 'TW',
  'THAILAND': 'TH',
  'Thailand': 'TH',
  'PHILIPPINES': 'PH',
  'Philippines': 'PH',
  'INDIA': 'IN',
  'India': 'IN',
  'SINGAPORE': 'SG',
  'Singapore': 'SG',
  'MALAYSIA': 'MY',
  'Malaysia': 'MY',
  'INDONESIA': 'ID',
  'Indonesia': 'ID',
  'FIJI': 'FJ',
  'Fiji': 'FJ',
  
  // Americas
  'CANADA': 'CA',
  'Canada': 'CA',
  'MEXICO': 'MX',
  'Mexico': 'MX',
  'BRAZIL': 'BR',
  'Brazil': 'BR',
  'ARGENTINA': 'AR',
  'Argentina': 'AR',
  'CHILE': 'CL',
  'Chile': 'CL',
  'COLOMBIA': 'CO',
  'Colombia': 'CO',
  'VENEZUELA': 'VE',
  'Venezuela': 'VE',
  'PUERTO RICO': 'PR',
  'Puerto Rico': 'PR',
  'BAHAMAS': 'BS',
  'Bahamas': 'BS',
  'BERMUDA': 'BM',
  'Bermuda': 'BM',
  'PARAGUAY': 'PY',
  'Paraguay': 'PY',
  
  // Africa
  'SOUTH AFRICA': 'ZA',
  'South Africa': 'ZA',
  'Africa': 'ZA',
  'NIGERIA': 'NG',
  'Nigeria': 'NG',
  'MOROCCO': 'MA',
  'Morocco': 'MA',
  'KENYA': 'KE',
  'Kenya': 'KE',
  'ZIMBABWE': 'ZW',
  'Zimbabwe': 'ZW',
  'Zambia': 'ZM',
  'Egypt': 'EG',
  'EGYPT': 'EG',
  'Uganda': 'UG',
  'Mauritius': 'MU',
  'Ghana': 'GH',
  'Tanzania': 'TZ',
  'Malawi': 'MW',
  'Tunisia': 'TN',
  'Namibia': 'NA',
  'Swaziland': 'SZ',
  'Senegal': 'SN',
  'Botswana': 'BW',
  'Madagascar': 'MG',
  'Gabon': 'GA',
  'Cameroon': 'CM',
  'Democratic Republic of Congo': 'CD',
  'Seychelles': 'SC',
  'Rwanda': 'RW',
  'Mozambique': 'MZ',
  'Ivory Coast': 'CI',
  'Gambia': 'GM',
  'Cape Verde': 'CV',
  'Angola': 'AO',
  'Togo': 'TG',
  'Sudan': 'SD',
  'Sierra Leone': 'SL',
  'Saint Helena, Ascension, Tristan Dukana': 'SH',
  'Mayotte': 'YT',
  'Libya': 'LY',
  'Lesotho': 'LS',
  'Ethiopia': 'ET',
  'Djibouti': 'DJ',
  'Chad': 'TD',
  'Central African Republic': 'CF',
  'Burundi': 'BI',
  'Burkina Faso': 'BF',
  'Benin': 'BJ',
  'Algeria': 'DZ',
  
  // Southern / Eastern Europe
  'GREECE': 'GR',
  'Greece': 'GR',
  'CZECH REPUBLIC': 'CZ',
  'Czech Republic': 'CZ',
  'POLAND': 'PL',
  'Poland': 'PL',
  'ROMANIA': 'RO',
  'Romania': 'RO',
  'HUNGARY': 'HU',
  'Hungary': 'HU',
  'TURKEY': 'TR',
  'Turkey': 'TR',
  'HONG KONG': 'HK',
  'Hong Kong': 'HK',

  // Middle East
  'UNITED ARAB EMIRATES': 'AE',
  'United Arab Emirates': 'AE',
  'UAE': 'AE',
  'ISRAEL': 'IL',
  'Israel': 'IL',
  'QATAR': 'QA',
  'Qatar': 'QA',
  'SAUDI ARABIA': 'SA',
  'Saudi Arabia': 'SA',
  'BAHRAIN': 'BH',
  'Bahrain': 'BH',

  // Regions with no single representative flag — explicitly null
  // These are intentionally unmapped; the null guard in UI components
  // will simply skip rendering a flag for these values.
  // 'Asia': null,
  // 'Caribbean': null,
  // 'Central and South America': null,
  // 'Middle East': null,
  // 'Oceania': null,
  // 'Rest of World': null,
};

// Explicitly unmapped regions — getFlagCode returns null for these.
// Documented here so future maintainers know the omission is intentional.
export const UNMAPPED_REGIONS = [
  'Asia',
  'Caribbean',
  'Central and South America',
  'Middle East',
  'Oceania',
  'Rest of World',
] as const;

// ---------------------------------------------------------------------------
// Three-letter (IOC / FIFA / ISO-3) codes -> flag code.
// BRIEF_TOUR_FLAGS_ONE_SYSTEM §2: the SVG path previously keyed only on full
// country NAMES, so any row supplying a code resolved to null and rendered
// nothing at all. Mapping lifted from features/tourhub/leaderboard/countryFlag.ts,
// which had the more complete table.
// ---------------------------------------------------------------------------
export const threeLetterToFlagCode: Record<string, string> = {
  // Home nations — subdivision codes, all four SVGs are served.
  ENG: 'GB-ENG', SCO: 'GB-SCT', WAL: 'GB-WLS', NIR: 'GB-NIR',
  GBR: 'GB', IRL: 'IE',

  // North America / Caribbean
  USA: 'US', CAN: 'CA', MEX: 'MX', PUR: 'PR', PRI: 'PR', DOM: 'DO',
  CRC: 'CR', PAN: 'PA', BAH: 'BS', BER: 'BM', BAR: 'BB', CAY: 'KY',
  JAM: 'JM', TRI: 'TT', CUB: 'CU', ESA: 'SV', NCA: 'NI', GUA: 'GT',
  HON: 'HN',

  // South America
  ARG: 'AR', BRA: 'BR', CHI: 'CL', CHL: 'CL', COL: 'CO', VEN: 'VE',
  PER: 'PE', PAR: 'PY', URU: 'UY', ECU: 'EC', BOL: 'BO', SUR: 'SR',

  // Europe
  FRA: 'FR', GER: 'DE', DEU: 'DE', ESP: 'ES', ITA: 'IT', SWE: 'SE',
  NOR: 'NO', DEN: 'DK', DNK: 'DK', NED: 'NL', NLD: 'NL', BEL: 'BE',
  AUT: 'AT', SUI: 'CH', CHE: 'CH', FIN: 'FI', POL: 'PL', CZE: 'CZ',
  POR: 'PT', PRT: 'PT', SVK: 'SK', SVN: 'SI', EST: 'EE', LAT: 'LV',
  LVA: 'LV', LTU: 'LT', UKR: 'UA', RUS: 'RU', ALB: 'AL', ARM: 'AM',
  TUR: 'TR', GRE: 'GR', GRC: 'GR', HUN: 'HU', ROU: 'RO', CRO: 'HR',
  SRB: 'RS', BUL: 'BG', ISL: 'IS', LUX: 'LU', MLT: 'MT', CYP: 'CY',
  GEO: 'GE',

  // Asia
  KOR: 'KR', JPN: 'JP', CHN: 'CN', TPE: 'TW', TWN: 'TW', HKG: 'HK',
  MAC: 'MO', IND: 'IN', THA: 'TH', PHI: 'PH', PHL: 'PH', MAS: 'MY',
  MYS: 'MY', SGP: 'SG', SIN: 'SG', BAN: 'BD', BGD: 'BD', PAK: 'PK',
  SRI: 'LK', LKA: 'LK', NEP: 'NP', VIE: 'VN', VNM: 'VN', CAM: 'KH',
  MYA: 'MM', MGL: 'MN', INA: 'ID', IDN: 'ID', KAZ: 'KZ', UZB: 'UZ',

  // Middle East
  BRN: 'BH', BHR: 'BH', UAE: 'AE', ARE: 'AE', QAT: 'QA', KSA: 'SA',
  SAU: 'SA', ISR: 'IL', LBN: 'LB', JOR: 'JO', IRQ: 'IQ', IRI: 'IR',
  KUW: 'KW', OMA: 'OM',

  // Africa
  RSA: 'ZA', ZAF: 'ZA', KEN: 'KE', ZIM: 'ZW', ZWE: 'ZW', UGA: 'UG',
  MAR: 'MA', MRI: 'MU', MUS: 'MU', NGA: 'NG', NGR: 'NG', RWA: 'RW',
  MWI: 'MW', BOT: 'BW', ZAM: 'ZM', TAN: 'TZ', ETH: 'ET', TUN: 'TN',
  ALG: 'DZ', EGY: 'EG', NAM: 'NA', MOZ: 'MZ', CIV: 'CI', CMR: 'CM',
  GHA: 'GH', SEN: 'SN', SEY: 'SC', GAM: 'GM', CPV: 'CV', ANG: 'AO',

  // Oceania
  AUS: 'AU', NZL: 'NZ', FIJ: 'FJ', FJI: 'FJ', SAM: 'WS', WSM: 'WS',
  TGA: 'TO', PNG: 'PG', GUM: 'GU',
};

// Full names the original map was missing — every remaining sr_players value.
const EXTRA_NAME_TO_FLAG_CODE: Record<string, string> = {
  ALBANIA: 'AL', ARMENIA: 'AM', SLOVENIA: 'SI', SLOVAKIA: 'SK',
  ESTONIA: 'EE', LATVIA: 'LV', LITHUANIA: 'LT', UKRAINE: 'UA',
  RUSSIA: 'RU', GEORGIA: 'GE', CROATIA: 'HR', SERBIA: 'RS',
  BULGARIA: 'BG', ICELAND: 'IS', LUXEMBOURG: 'LU', MALTA: 'MT',
  CYPRUS: 'CY',
  BARBADOS: 'BB', 'CAYMAN ISLANDS': 'KY', 'DOMINICAN REPUBLIC': 'DO',
  'COSTA RICA': 'CR', JAMAICA: 'JM', 'TRINIDAD AND TOBAGO': 'TT',
  CUBA: 'CU', 'EL SALVADOR': 'SV', NICARAGUA: 'NI', GUATEMALA: 'GT',
  HONDURAS: 'HN', PANAMA: 'PA', BELIZE: 'BZ',
  PERU: 'PE', URUGUAY: 'UY', ECUADOR: 'EC', BOLIVIA: 'BO',
  SURINAME: 'SR',
  PAKISTAN: 'PK', 'SRI LANKA': 'LK', BANGLADESH: 'BD', NEPAL: 'NP',
  VIETNAM: 'VN', CAMBODIA: 'KH', MYANMAR: 'MM', MONGOLIA: 'MN',
  MACAU: 'MO', KAZAKHSTAN: 'KZ', UZBEKISTAN: 'UZ',
  LEBANON: 'LB', JORDAN: 'JO', IRAQ: 'IQ', IRAN: 'IR', KUWAIT: 'KW',
  OMAN: 'OM', YEMEN: 'YE', AFGHANISTAN: 'AF',
  SAMOA: 'WS', TONGA: 'TO', 'PAPUA NEW GUINEA': 'PG', GUAM: 'GU',
};

export const getFlagCode = (country: string | null | undefined): string | null => {
  if (!country) return null;

  // Try exact match first
  if (countryToFlagCode[country]) {
    return countryToFlagCode[country];
  }

  // Normalised uppercase form (also the key shape for codes / extras)
  const upperCase = country.trim().toUpperCase().replace(/\s+/g, ' ');
  if (countryToFlagCode[upperCase]) {
    return countryToFlagCode[upperCase];
  }
  if (EXTRA_NAME_TO_FLAG_CODE[upperCase]) {
    return EXTRA_NAME_TO_FLAG_CODE[upperCase];
  }

  // Three-letter code form (rows that pass country_code rather than a name)
  if (upperCase.length === 3 && threeLetterToFlagCode[upperCase]) {
    return threeLetterToFlagCode[upperCase];
  }

  // Try title case
  const titleCase = upperCase.split(' ').map(w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
  if (countryToFlagCode[titleCase]) {
    return countryToFlagCode[titleCase];
  }

  // Log unknown countries for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Unknown country for flag: ${country}`);
  }

  return null; // Return null instead of defaulting to GB
};

/**
 * countryShortCode — the three-letter mark used inside the fallback chip when
 * no SVG can be resolved (or when policy withholds a national flag, as for
 * Northern Ireland). Never returns an empty string for a non-empty input.
 */
export function countryShortCode(country: string | null | undefined): string {
  if (!country) return '';
  const key = country.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!key) return '';
  if (key === 'NORTHERN IRELAND' || key === 'NIR') return 'NIR';
  if (key.length <= 3) return key;
  // Multi-word names read better as initials (e.g. UNITED ARAB EMIRATES -> UAE)
  const words = key.split(' ').filter(Boolean);
  if (words.length >= 3) return words.map(w => w[0]).join('').slice(0, 3);
  return key.slice(0, 3);
}

