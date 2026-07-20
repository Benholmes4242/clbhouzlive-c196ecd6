/**
 * Static continent → country mapping for admin course sheets.
 *
 * Continent keys match the exact values stored in golf_courses.continent
 * (verified via SELECT DISTINCT continent FROM golf_courses).
 *
 * Convention note: existing golf_courses.country data uses broad regional
 * labels ("Britain & Ireland", "Continental Europe", "Asia", "Oceania",
 * "Africa", "Caribbean", "Central and South America"). New entries should
 * use real country names. The legacy labels are kept in-list so existing
 * records are never orphaned as "(unrecognised)".
 */

export const CONTINENT_COUNTRIES: Record<string, string[]> = {
  'Africa': [
    // Legacy label
    'Africa',
    // Countries
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cameroon', 'Central African Republic', 'Chad', 'Comoros',
    'Congo', 'Cote d\'Ivoire', 'Democratic Republic of the Congo', 'Djibouti',
    'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia',
    'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau',
    'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
    'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique',
    'Namibia', 'Niger', 'Nigeria', 'Rwanda',
    'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone',
    'Somalia', 'South Africa', 'South Sudan', 'Sudan',
    'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
  ],
  'Asia': [
    // Legacy labels
    'Asia', 'Middle East',
    // Countries
    'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh',
    'Bhutan', 'Brunei', 'Cambodia', 'China', 'Cyprus',
    'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel',
    'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Lebanon', 'Malaysia', 'Maldives', 'Mongolia',
    'Myanmar', 'Nepal', 'North Korea', 'Oman', 'Pakistan',
    'Palestine', 'Philippines', 'Qatar', 'Saudi Arabia',
    'Singapore', 'South Korea', 'Sri Lanka', 'Syria',
    'Taiwan', 'Tajikistan', 'Thailand', 'Timor-Leste',
    'Turkey', 'Turkmenistan', 'United Arab Emirates',
    'Uzbekistan', 'Vietnam', 'Yemen',
  ],
  'Europe': [
    // Legacy labels
    'Britain & Ireland', 'Continental Europe',
    // Home nations (matches existing data convention)
    'England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland',
    // Countries
    'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium',
    'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Czech Republic',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
    'Hungary', 'Iceland', 'Italy', 'Kosovo', 'Latvia',
    'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova',
    'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway',
    'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino',
    'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
    'Switzerland', 'Ukraine', 'United Kingdom',
  ],
  'North America': [
    // Legacy labels
    'Caribbean', 'Central and South America', 'Rest of World',
    // Countries
    'Antigua and Barbuda', 'Bahamas', 'Barbados', 'Belize',
    'Canada', 'Costa Rica', 'Cuba', 'Curacao', 'Dominica',
    'Dominican Republic', 'El Salvador', 'Grenada', 'Guatemala',
    'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama',
    'Puerto Rico', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Trinidad and Tobago', 'USA',
    'US Virgin Islands',
  ],
  'Oceania': [
    // Legacy label
    'Oceania',
    // Countries
    'Australia', 'Fiji', 'Kiribati', 'Marshall Islands',
    'Micronesia', 'Nauru', 'New Zealand', 'Palau',
    'Papua New Guinea', 'Samoa', 'Solomon Islands',
    'Tonga', 'Tuvalu', 'Vanuatu',
  ],
  'South America': [
    // Legacy label
    'Central and South America',
    // Countries
    'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia',
    'Ecuador', 'Guyana', 'Paraguay', 'Peru', 'Suriname',
    'Uruguay', 'Venezuela',
  ],
};

/** Sorted country list for a given continent. */
export function countriesForContinent(continent: string): string[] {
  const list = CONTINENT_COUNTRIES[continent];
  if (!list) return [];
  return [...list].sort((a, b) => a.localeCompare(b));
}

/** Check whether a country belongs to the given continent's list. */
export function isCountryInContinent(country: string, continent: string): boolean {
  const list = CONTINENT_COUNTRIES[continent];
  return !!list && list.includes(country);
}
