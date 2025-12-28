/**
 * Unified type for suggested items in the carousel (golfers + businesses)
 */

export interface MutualFriendPreview {
  id: string;
  avatar_url: string | null;
  display_name: string;
}

export type SuggestedGolfer = {
  type: 'golfer';
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club?: string | null;
  is_verified?: boolean;
  eg_handicap_index?: number | null;
  show_handicap?: boolean;
  is_public?: boolean;
  reason?: 'similar_handicap' | 'plays_near' | 'mutuals' | 'recently_active' | 'suggested';
  mutual_count?: number;
  mutual_friends?: MutualFriendPreview[];
};

export type SuggestedBusiness = {
  type: 'business';
  id: string;
  name: string;
  logo_url: string | null;
  category?: string | null;
  location_label?: string | null;
  is_verified?: boolean;
  reason?: string;
};

export type SuggestedItem = SuggestedGolfer | SuggestedBusiness;

/**
 * UK region code mapping - Mapbox returns these short codes for UK regions
 */
const UK_REGION_MAP: Record<string, string> = {
  'ENG': 'England',
  'SCO': 'Scotland',
  'SCT': 'Scotland',
  'WAL': 'Wales',
  'WLS': 'Wales',
  'NIR': 'Northern Ireland',
};

/**
 * Normalize a region value for UK - maps codes like ENG to "England"
 * For non-UK countries, returns the region as-is if it looks human-readable
 */
function normalizeRegion(region: string, country: string | null | undefined): string | null {
  const trimmed = region.trim();
  
  // For UK, use the region map
  if (country === 'United Kingdom') {
    const mapped = UK_REGION_MAP[trimmed.toUpperCase()];
    if (mapped) return mapped;
  }
  
  // Check if it looks like a short code (2-3 uppercase letters or ISO-style like GB-ENG)
  const isCode = /^[A-Z]{2,3}$/.test(trimmed) || /^[A-Z]{2}-[A-Z]{2,3}$/.test(trimmed);
  
  // If it's a code and not UK (already handled above), skip it
  if (isCode) return null;
  
  // Otherwise it's human-readable, return as-is
  return trimmed;
}

/**
 * Build a location label from business account fields
 * Format: "Country, Region" (preferred) or "Country, SubCountry" (fallback)
 * UK region codes (ENG, SCT, etc.) are mapped to full names
 */
export function buildBusinessLocationLabel(business: {
  location?: string | null;
  city?: string | null;
  region?: string | null;
  sub_country?: string | null;
  country?: string | null;
}): string | null {
  // Try to normalize the region (handles UK code mapping)
  const normalizedRegion = business.region 
    ? normalizeRegion(business.region, business.country) 
    : null;
  
  // Preferred: Country, Region (only if region is valid/normalized)
  if (business.country && normalizedRegion) {
    return `${business.country}, ${normalizedRegion}`;
  }
  // Fallback: Country, SubCountry
  if (business.country && business.sub_country) {
    return `${business.country}, ${business.sub_country}`;
  }
  // Just country
  if (business.country) {
    return business.country;
  }
  // Nothing usable
  return null;
}
