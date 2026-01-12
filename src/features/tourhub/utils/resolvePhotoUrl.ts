/**
 * Resolve player photo URLs to full URLs
 * 
 * Handles:
 * - Relative paths like /player-headshots/scottie-scheffler.png
 * - Full URLs (https://...)
 * - Skips ui-avatars.com URLs (initials generators, not real photos)
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  
  // Skip ui-avatars.com URLs (these are just initials generators, not real photos)
  if (photoUrl.includes('ui-avatars.com')) return null;
  
  // If it's already a full URL, use it
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // If it's a relative path to player-headshots, resolve to Supabase Storage
  if (photoUrl.startsWith('/player-headshots/')) {
    const filename = photoUrl.replace('/player-headshots/', '');
    return `${SUPABASE_URL}/storage/v1/object/public/player-headshots/${filename}`;
  }
  
  // For other relative paths starting with /
  if (photoUrl.startsWith('/')) {
    return `${SUPABASE_URL}/storage/v1/object/public${photoUrl}`;
  }
  
  return photoUrl;
}
