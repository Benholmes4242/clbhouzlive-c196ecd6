/**
 * Maps country names (from golf_clubs.sub_country) to ISO 3166-1 alpha-2 codes.
 * Used for address search and country selector integration.
 */
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // Europe
  'United Kingdom': 'GB',
  'England': 'GB',
  'Scotland': 'GB',
  'Wales': 'GB',
  'Northern Ireland': 'GB',
  'Ireland': 'IE',
  'France': 'FR',
  'Germany': 'DE',
  'Spain': 'ES',
  'Italy': 'IT',
  'Portugal': 'PT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Poland': 'PL',
  'Czech Republic': 'CZ',
  'Czechia': 'CZ',
  'Hungary': 'HU',
  'Greece': 'GR',
  'Turkey': 'TR',
  'Croatia': 'HR',
  'Slovenia': 'SI',
  'Slovakia': 'SK',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Serbia': 'RS',
  'Ukraine': 'UA',
  'Russia': 'RU',
  'Iceland': 'IS',
  'Luxembourg': 'LU',
  'Monaco': 'MC',
  'Andorra': 'AD',
  'Malta': 'MT',
  'Cyprus': 'CY',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Belarus': 'BY',
  'Moldova': 'MD',
  'Albania': 'AL',
  'North Macedonia': 'MK',
  'Bosnia and Herzegovina': 'BA',
  'Montenegro': 'ME',
  'Kosovo': 'XK',
  'Liechtenstein': 'LI',
  'San Marino': 'SM',
  
  // Americas
  'United States': 'US',
  'USA': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Venezuela': 'VE',
  'Ecuador': 'EC',
  'Bolivia': 'BO',
  'Paraguay': 'PY',
  'Uruguay': 'UY',
  'Costa Rica': 'CR',
  'Panama': 'PA',
  'Guatemala': 'GT',
  'Honduras': 'HN',
  'El Salvador': 'SV',
  'Nicaragua': 'NI',
  'Dominican Republic': 'DO',
  'Puerto Rico': 'PR',
  'Jamaica': 'JM',
  'Cuba': 'CU',
  'Haiti': 'HT',
  'Trinidad and Tobago': 'TT',
  'Bahamas': 'BS',
  'Barbados': 'BB',
  'Bermuda': 'BM',
  'Cayman Islands': 'KY',
  'Aruba': 'AW',
  'Curaçao': 'CW',
  
  // Asia
  'Japan': 'JP',
  'China': 'CN',
  'South Korea': 'KR',
  'Korea': 'KR',
  'India': 'IN',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Indonesia': 'ID',
  'Malaysia': 'MY',
  'Singapore': 'SG',
  'Philippines': 'PH',
  'Taiwan': 'TW',
  'Hong Kong': 'HK',
  'Macau': 'MO',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Sri Lanka': 'LK',
  'Nepal': 'NP',
  'Myanmar': 'MM',
  'Cambodia': 'KH',
  'Laos': 'LA',
  'Brunei': 'BN',
  'Mongolia': 'MN',
  'Kazakhstan': 'KZ',
  'Uzbekistan': 'UZ',
  'Kyrgyzstan': 'KG',
  'Tajikistan': 'TJ',
  'Turkmenistan': 'TM',
  'Azerbaijan': 'AZ',
  'Georgia': 'GE',
  'Armenia': 'AM',
  
  // Middle East
  'United Arab Emirates': 'AE',
  'UAE': 'AE',
  'Saudi Arabia': 'SA',
  'Qatar': 'QA',
  'Kuwait': 'KW',
  'Bahrain': 'BH',
  'Oman': 'OM',
  'Israel': 'IL',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'Syria': 'SY',
  'Iraq': 'IQ',
  'Iran': 'IR',
  'Yemen': 'YE',
  
  // Africa
  'South Africa': 'ZA',
  'Egypt': 'EG',
  'Morocco': 'MA',
  'Kenya': 'KE',
  'Nigeria': 'NG',
  'Ghana': 'GH',
  'Tanzania': 'TZ',
  'Uganda': 'UG',
  'Ethiopia': 'ET',
  'Tunisia': 'TN',
  'Algeria': 'DZ',
  'Zimbabwe': 'ZW',
  'Zambia': 'ZM',
  'Botswana': 'BW',
  'Namibia': 'NA',
  'Mauritius': 'MU',
  'Rwanda': 'RW',
  'Senegal': 'SN',
  'Ivory Coast': 'CI',
  "Côte d'Ivoire": 'CI',
  'Cameroon': 'CM',
  'Angola': 'AO',
  'Mozambique': 'MZ',
  
  // Oceania
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Fiji': 'FJ',
  'Papua New Guinea': 'PG',
  'Guam': 'GU',
  'New Caledonia': 'NC',
  'French Polynesia': 'PF',
  'Samoa': 'WS',
  'Tonga': 'TO',
  'Vanuatu': 'VU',
  'Solomon Islands': 'SB',
  'Cook Islands': 'CK',
};

// US states to 'US' code
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
];

US_STATES.forEach(state => {
  COUNTRY_NAME_TO_CODE[state] = 'US';
});

/**
 * Convert a country name to ISO 3166-1 alpha-2 code.
 * Falls back to null if no mapping found.
 */
export function countryNameToCode(countryName: string | null | undefined): string | null {
  if (!countryName) return null;
  
  // Direct lookup
  const directMatch = COUNTRY_NAME_TO_CODE[countryName];
  if (directMatch) return directMatch;
  
  // Case-insensitive lookup
  const normalizedName = countryName.trim();
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (name.toLowerCase() === normalizedName.toLowerCase()) {
      return code;
    }
  }
  
  return null;
}

/**
 * Get a country code from golf club data, checking sub_country first, then country.
 */
export function getCountryCodeFromClub(club: {
  country?: string | null;
  sub_country?: string | null;
  region?: string | null;
}): string | null {
  // sub_country often has the actual country name
  if (club.sub_country) {
    const code = countryNameToCode(club.sub_country);
    if (code) return code;
  }
  
  // country field contains continent/region names, not useful for ISO codes
  // but try anyway for edge cases
  if (club.country) {
    const code = countryNameToCode(club.country);
    if (code) return code;
  }
  
  return null;
}
