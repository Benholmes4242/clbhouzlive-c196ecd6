const R2_BASE = 'https://pub-6cf95a65a08e40a8b698e60f84d0d38a.r2.dev';
const FOLDER = 'D1 College Logos';

/**
 * Mapping for database college names that differ from R2 filenames.
 * Key = exact value in sr_players.college / college_media.college_name
 * Value = R2 filename (without .webp)
 */
const COLLEGE_NAME_OVERRIDES: Record<string, string> = {
  'Arizona State University': 'Arizona_State',
  'Georgia Southern ': 'Georgia_Southern', // trailing space in DB
  'Loyola Marymount University': 'Loyola_Marymount',
  'Loyola University Maryland': 'Loyola_Maryland',
  'Miami (OH)': 'Miami_OH',
  'North Carolina State': 'NC_State',
  'Penn': 'Pennsylvania',
  "Saint Mary's": 'Saint_Marys',
  'San Jose State': 'San_José_State',
  "St. John's": 'St_Johns',
  'Texas-Arlington': 'UT_Arlington',
  'Methodist University': 'Methodist',
};

/**
 * Build the R2 college logo URL from a college name.
 * @param collegeName - The exact value from sr_players.college or college_media.college_name
 * @returns The full R2 URL, or null if no name provided
 */
export function getCollegeLogoUrl(collegeName: string | null | undefined): string | null {
  if (!collegeName || !collegeName.trim()) return null;

  const trimmed = collegeName.trim();

  // Check overrides first
  if (COLLEGE_NAME_OVERRIDES[trimmed]) {
    const filename = COLLEGE_NAME_OVERRIDES[trimmed];
    return `${R2_BASE}/${encodeURIComponent(FOLDER)}/${encodeURIComponent(filename)}.webp`;
  }

  // Default: replace spaces with underscores
  const filename = trimmed.replace(/\s+/g, '_');
  return `${R2_BASE}/${encodeURIComponent(FOLDER)}/${encodeURIComponent(filename)}.webp`;
}
