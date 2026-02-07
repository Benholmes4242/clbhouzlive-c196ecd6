
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
  'ENGLAND': 'GB',
  'England': 'GB',
  'GREAT BRITAIN': 'GB',
  'Great Britain': 'GB',
  'UNITED KINGDOM': 'GB',
  'United Kingdom': 'GB',
  'UK': 'GB',
  
  'SCOTLAND': 'GB-SCT',
  'Scotland': 'GB-SCT',
  
  'WALES': 'GB-WLS',
  'Wales': 'GB-WLS',
  
  'NORTHERN IRELAND': 'GB',
  'Northern Ireland': 'GB',
  
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

export const getFlagCode = (country: string | null | undefined): string | null => {
  if (!country) return null;
  
  // Try exact match first
  if (countryToFlagCode[country]) {
    return countryToFlagCode[country];
  }
  
  // Try uppercase
  const upperCase = country.toUpperCase();
  if (countryToFlagCode[upperCase]) {
    return countryToFlagCode[upperCase];
  }
  
  // Try title case
  const titleCase = country.split(' ').map(w => 
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
