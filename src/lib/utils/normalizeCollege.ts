/**
 * Normalizes a college name to a canonical form for matching/lookup.
 * Used to match inconsistent player college data with canonical college_media records.
 * 
 * Examples:
 *   "University of Texas" → "texas"
 *   "Texas State University" → "texasstate"
 *   "San Diego State" → "sandiegostate"
 *   "UCLA" → "ucla"
 */
export function normalizeCollege(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/university of\s*/gi, '')
    .replace(/\s*university$/gi, '')
    .replace(/\s*college$/gi, '')
    .replace(/\s*state\s*university$/gi, ' state')
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, '')
    .trim();
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
