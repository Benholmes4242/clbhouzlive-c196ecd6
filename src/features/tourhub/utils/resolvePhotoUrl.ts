/**
 * Resolve player photo URLs to full URLs
 * 
 * Handles:
 * - SportRadar API URLs: routed through image-proxy edge function to handle 302 redirects
 * - Relative paths like /player-headshots/scottie-scheffler.png (served from public folder)
 * - Supabase Storage URLs: returned as-is
 * - Skips ui-avatars.com URLs (initials generators, not real photos)
 */

const SUPABASE_URL = 'https://ybxkehyomcakqjvuhnna.supabase.co';

const IS_DEV = import.meta.env.DEV;

export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (IS_DEV) console.log('resolvePhotoUrl input:', photoUrl);
  if (!photoUrl) return null;
  
  // Skip ui-avatars.com URLs (these are just initials generators, not real photos)
  if (photoUrl.includes('ui-avatars.com')) return null;
  
  // If it's a SportRadar API URL, route through our proxy to handle 302 redirects
  if (photoUrl.includes('api.sportradar.com')) {
    const proxied = `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(photoUrl)}`;
    if (IS_DEV) console.log('resolvePhotoUrl output (proxied):', proxied);
    return proxied;
  }
  
  // If it's already a full URL (Supabase Storage, CDN, etc.), use it directly
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    if (IS_DEV) console.log('resolvePhotoUrl output (passthrough):', photoUrl);
    return photoUrl;
  }
  
  // Relative paths starting with / are served from the public folder
  // e.g., /player-headshots/scottie-scheffler.png works directly
  if (photoUrl.startsWith('/')) {
    if (IS_DEV) console.log('resolvePhotoUrl output (relative):', photoUrl);
    return photoUrl;
  }
  
  if (IS_DEV) console.log('resolvePhotoUrl output (default):', photoUrl);
  return photoUrl;
}
