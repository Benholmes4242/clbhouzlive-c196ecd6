/**
 * Country → continent map for the Global tab.
 *
 * Source-of-truth for explorer data is `user_exploration_stats.country_list`
 * which stores country names (e.g. "Scotland", "United Arab Emirates"), not
 * ISO codes. The DB does not carry a per-country continent — `golf_courses`
 * uses regional groupings — so we derive continent client-side here.
 *
 * Falls back to "—" when unknown.
 */
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Europe
  'England': 'Europe',
  'Scotland': 'Europe',
  'Wales': 'Europe',
  'Ireland': 'Europe',
  'Northern Ireland': 'Europe',
  'France': 'Europe',
  'Spain': 'Europe',
  'Portugal': 'Europe',
  'Italy': 'Europe',
  'Germany': 'Europe',
  'Netherlands': 'Europe',
  'Belgium': 'Europe',
  'Sweden': 'Europe',
  'Norway': 'Europe',
  'Denmark': 'Europe',
  'Finland': 'Europe',
  'Iceland': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'Greece': 'Europe',
  'Turkey': 'Europe',
  'Czech Republic': 'Europe',
  'Czechia': 'Europe',
  'Poland': 'Europe',
  'Hungary': 'Europe',
  'Croatia': 'Europe',
  'Slovenia': 'Europe',
  'Estonia': 'Europe',
  'Latvia': 'Europe',
  'Lithuania': 'Europe',
  'Russia': 'Europe',
  'Ukraine': 'Europe',

  // North America
  'USA': 'North America',
  'United States': 'North America',
  'United States of America': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  'Bermuda': 'North America',
  'Bahamas': 'North America',
  'Cuba': 'North America',
  'Jamaica': 'North America',
  'Dominican Republic': 'North America',
  'Puerto Rico': 'North America',
  'Costa Rica': 'North America',
  'Panama': 'North America',

  // South America
  'Argentina': 'South America',
  'Brazil': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Peru': 'South America',
  'Uruguay': 'South America',
  'Venezuela': 'South America',
  'Ecuador': 'South America',

  // Asia
  'China': 'Asia',
  'Japan': 'Asia',
  'South Korea': 'Asia',
  'India': 'Asia',
  'Indonesia': 'Asia',
  'Thailand': 'Asia',
  'Vietnam': 'Asia',
  'Malaysia': 'Asia',
  'Singapore': 'Asia',
  'Philippines': 'Asia',
  'Hong Kong': 'Asia',
  'Taiwan': 'Asia',
  'United Arab Emirates': 'Asia',
  'Saudi Arabia': 'Asia',
  'Qatar': 'Asia',
  'Bahrain': 'Asia',
  'Oman': 'Asia',
  'Israel': 'Asia',
  'Jordan': 'Asia',
  'Lebanon': 'Asia',

  // Africa
  'South Africa': 'Africa',
  'Morocco': 'Africa',
  'Egypt': 'Africa',
  'Kenya': 'Africa',
  'Tanzania': 'Africa',
  'Mauritius': 'Africa',
  'Tunisia': 'Africa',
  'Namibia': 'Africa',
  'Botswana': 'Africa',
  'Zimbabwe': 'Africa',

  // Oceania
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'Fiji': 'Oceania',
  'Papua New Guinea': 'Oceania',
};

export function continentForCountry(country: string | null | undefined): string {
  if (!country) return '—';
  return COUNTRY_TO_CONTINENT[country] ?? '—';
}
