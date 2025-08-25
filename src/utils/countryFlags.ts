
// Map country names to ISO country codes for flag display
export const countryToFlagCode: Record<string, string> = {
  'USA': 'US',
  'Britain & Ireland': 'GB', // Using GB for Great Britain
  'Continental Europe': 'EU', // Using EU flag for Continental Europe
  'England': 'GB-ENG', // England flag (St. George's Cross)
  'Scotland': 'GB',
  'Wales': 'GB',
  'Ireland': 'IE',
  'Northern Ireland': 'GB',
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
  'South Africa': 'ZA',
  'Japan': 'JP',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL'
};

export const getFlagCode = (country: string): string => {
  return countryToFlagCode[country] || 'GB'; // Default to GB if not found
};
