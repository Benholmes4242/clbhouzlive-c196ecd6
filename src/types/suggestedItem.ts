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
 */
export function buildBusinessLocationLabel(business: {
  location?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string | null {
  if (business.location) return business.location;
  
  const parts = [business.city, business.region, business.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
