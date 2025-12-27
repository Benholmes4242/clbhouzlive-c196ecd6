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
 * Build a location label from business account fields
 * Format: "Country, Region" (preferred) or "Country, SubCountry" (fallback)
 */
export function buildBusinessLocationLabel(business: {
  location?: string | null;
  city?: string | null;
  region?: string | null;
  sub_country?: string | null;
  country?: string | null;
}): string | null {
  // Preferred: Country, Region
  if (business.country && business.region) {
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
  // Just region
  if (business.region) {
    return business.region;
  }
  // Just sub_country
  if (business.sub_country) {
    return business.sub_country;
  }
  // Nothing
  return null;
}
