/**
 * Common formatting utilities
 */

/**
 * Converts a string to Title Case (e.g., "UNITED STATES" -> "United States")
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
