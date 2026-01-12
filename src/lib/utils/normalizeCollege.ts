/**
 * Common college name aliases for better matching.
 * Maps common abbreviations and variations to normalized names.
 */
const COLLEGE_ALIASES: Record<string, string> = {
  // Abbreviations
  'usc': 'southerncalifornia',
  'cal': 'california',
  'olemiss': 'mississippi',
  'ole miss': 'mississippi',
  'ohiostate': 'ohiostate',
  'ohio state': 'ohiostate',
  'the ohio state': 'ohiostate',
  'unc': 'northcarolina',
  'unc chapel hill': 'northcarolina',
  'lsu': 'louisianastate',
  'ucf': 'centralflorida',
  'unlv': 'nevadalasvegas',
  'utep': 'texaselpaso',
  'smu': 'southernmethodist',
  'tcu': 'texaschristian',
  'byu': 'brighamyoung',
  'texasam': 'texasam',
  'texas a&m': 'texasam',
  'a&m': 'texasam',
  // Common variations
  'nc state': 'northcarolinastate',
  'penn state': 'pennstate',
  'penn': 'pennsylvania',
  'arizona st': 'arizonastate',
  'oregon st': 'oregonstate',
  'michigan st': 'michiganstate',
  'san jose st': 'sanjosestate',
  'fresno st': 'fresnostate',
  'kent st': 'kentstate',
  'ball st': 'ballstate',
  'boise st': 'boisestate',
};

/**
 * Normalizes a college name to a canonical form for matching/lookup.
 * Used to match inconsistent player college data with canonical college_media records.
 * 
 * Examples:
 *   "University of Texas" → "texas"
 *   "Texas State University" → "texasstate"
 *   "San Diego State" → "sandiegostate"
 *   "UCLA" → "ucla"
 *   "USC" → "southerncalifornia"
 *   "Texas A&M" → "texasam"
 */
export function normalizeCollege(name: string): string {
  if (!name) return '';
  
  // First check for exact alias matches (before any processing)
  const lowerName = name.toLowerCase().trim();
  if (COLLEGE_ALIASES[lowerName]) {
    return COLLEGE_ALIASES[lowerName];
  }
  
  // Standard normalization
  let normalized = name
    .toLowerCase()
    .replace(/university of\s*/gi, '')
    .replace(/\s*university$/gi, '')
    .replace(/\s*college$/gi, '')
    .replace(/\s*state\s*university$/gi, ' state')
    .replace(/&/g, '') // Handle ampersands (A&M → AM)
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, '')
    .trim();
  
  // Check aliases again after normalization
  if (COLLEGE_ALIASES[normalized]) {
    return COLLEGE_ALIASES[normalized];
  }
  
  return normalized;
}

/**
 * Creates a display-friendly college name from the normalized name.
 * This is a fallback when no official name is available.
 */
export function denormalizeCollege(normalized: string): string {
  if (!normalized) return '';
  
  // Add spaces before capital-like transitions (heuristic)
  const withSpaces = normalized
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/state$/i, ' State');
  
  // Capitalize first letter of each word
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
