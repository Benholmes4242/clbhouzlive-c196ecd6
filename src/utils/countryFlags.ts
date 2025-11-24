
// Map country names to ISO country codes for flag display
export const countryToFlagCode: Record<string, string> = {
  'USA': 'US',
  'Britain & Ireland': 'GB', // Using GB for Great Britain
  'Continental Europe': 'EU', // Using EU flag for Continental Europe
  'England': 'GB-ENG', // England flag (St. George's Cross)
  'Scotland': 'GB-SCT', // Scotland flag (St. Andrew's Cross)
  'Wales': 'GB-WLS', // Wales flag (Red Dragon)
  'Ireland': 'IE',
  'Northern Ireland': 'GB-NIR', // Northern Ireland flag
  'France': 'FR',
  'Germany': 'DE',
  'Spain': 'ES',
  'Italy': 'IT',
  'Portugal': 'PT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Denmark': 'DK',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Finland': 'FI',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Japan': 'JP',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  // African countries
  'Africa': 'ZA', // Using South Africa flag for Africa region
  'South Africa': 'ZA',
  'Nigeria': 'NG',
  'Morocco': 'MA',
  'Kenya': 'KE',
  'Zimbabwe': 'ZW',
  'Zambia': 'ZM',
  'Egypt': 'EG',
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
  'Algeria': 'DZ'
};

export const getFlagCode = (country: string): string => {
  return countryToFlagCode[country] || 'GB'; // Default to GB if not found
};
