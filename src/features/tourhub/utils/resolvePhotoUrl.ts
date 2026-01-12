/**
 * Resolve player photo URLs to full URLs
 * 
 * Handles:
 * - Relative paths like /player-headshots/scottie-scheffler.png (served from public folder)
 * - Full URLs (https://...)
 * - Skips ui-avatars.com URLs (initials generators, not real photos)
 */

export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  
  // Skip ui-avatars.com URLs (these are just initials generators, not real photos)
  if (photoUrl.includes('ui-avatars.com')) return null;
  
  // If it's already a full URL, use it
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // Relative paths starting with / are served from the public folder
  // e.g., /player-headshots/scottie-scheffler.png works directly
  if (photoUrl.startsWith('/')) {
    return photoUrl;
  }
  
  return photoUrl;
}
