/**
 * Unified type for suggested items in the carousel (golfers + businesses)
 */

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
 * Check if a region string looks like a short code (e.g., ENG, SCT, WLS, NIR)
 * These are not suitable for display - we want full names like "England"
 */
function isRegionCode(region: string): boolean {
  const trimmed = region.trim();
  // Match 2-3 uppercase letters (e.g., ENG, SCT, WLS, NIR)
  if (/^[A-Z]{2,3}$/.test(trimmed)) {
    return true;
  }
  // Match ISO-style codes like GB-ENG
  if (/^[A-Z]{2}-[A-Z]{2,3}$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Build a location label from business account fields
 * Format: "Country, Region" (preferred) or "Country, SubCountry" (fallback)
 * Region codes (ENG, SCT, etc.) are ignored - we only use human-readable names
 */
export function buildBusinessLocationLabel(business: {
  location?: string | null;
  city?: string | null;
  region?: string | null;
  sub_country?: string | null;
  country?: string | null;
}): string | null {
  const hasValidRegion = business.region && !isRegionCode(business.region);
  
  // Preferred: Country, Region (only if region is not a code)
  if (business.country && hasValidRegion) {
    return `${business.country}, ${business.region}`;
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
