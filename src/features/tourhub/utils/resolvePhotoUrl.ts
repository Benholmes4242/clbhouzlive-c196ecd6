/**
 * Resolve player photo URLs to full URLs
 * 
 * Handles:
 * - SportRadar API URLs (proxied through edge function to handle 302 redirects)
 * - Relative paths like /player-headshots/scottie-scheffler.png (served from public folder)
 * - Full URLs (https://...)
 * - Skips ui-avatars.com URLs (initials generators, not real photos)
 */

const SUPABASE_URL = 'https://ybxkehyomcakqjvuhnna.supabase.co';

export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  
  // Skip ui-avatars.com URLs (these are just initials generators, not real photos)
  if (photoUrl.includes('ui-avatars.com')) return null;
  
  // Proxy SportRadar API URLs through our edge function to handle 302 redirects
  if (photoUrl.includes('api.sportradar.com')) {
    return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(photoUrl)}`;
  }
  
  // If it's already a full URL, use it
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // Relative paths starting with / are served from the public folder
  if (photoUrl.startsWith('/')) {
    return photoUrl;
  }
  
  return photoUrl;
}
