/**
 * Resolve player photo URLs to full URLs
 * 
 * Priority:
 *   1. Cloudinary CDN (if pga_tour_id provided) - stable, no rate limits
 *   2. SportRadar API URLs: routed through image-proxy edge function
 *   3. Relative paths like /player-headshots/scottie-scheffler.png
 *   4. Supabase Storage URLs: returned as-is
 *   5. null (triggers initials fallback in components)
 * 
 * Skips ui-avatars.com URLs (initials generators, not real photos)
 */

const SUPABASE_URL = 'https://ybxkehyomcakqjvuhnna.supabase.co';

/**
 * Generate a stable PGA Tour Cloudinary headshot URL from a PGA Tour player ID.
 * This bypasses SportRadar rate limits entirely.
 * 
 * @param pgaTourId - The official PGA Tour player ID (e.g., "46046" for Scottie Scheffler)
 * @returns Cloudinary URL for the player's headshot
 */
export function getPgaTourHeadshotUrl(pgaTourId: string): string {
  return `https://pga-tour-res.cloudinary.com/image/upload/c_fill,g_face:center,q_auto,f_auto,dpr_2.0,h_220,w_200,d_stub:default_avatar_light.webp/headshots_${pgaTourId}`;
}

/**
 * Resolves the best available photo URL for a player.
 * 
 * @param photoUrl - The photo_url from sr_players table
 * @param pgaTourId - Optional pga_tour_id for Cloudinary resolution (preferred)
 * @returns Resolved photo URL or null
 */
export function resolvePhotoUrl(
  photoUrl: string | null | undefined,
  pgaTourId?: string | null
): string | null {
  // Priority 1: Use Cloudinary if pga_tour_id exists
  if (pgaTourId) {
    return getPgaTourHeadshotUrl(pgaTourId);
  }

  // Priority 2+: Handle photo_url
  if (!photoUrl) return null;
  
  // Skip ui-avatars.com URLs (these are just initials generators, not real photos)
  if (photoUrl.includes('ui-avatars.com')) return null;
  
  // If it's a SportRadar API URL, route through our proxy to handle 302 redirects
  if (photoUrl.includes('api.sportradar.com')) {
    return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(photoUrl)}`;
  }
  
  // If it's already a full URL (Supabase Storage, CDN, etc.), use it directly
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
