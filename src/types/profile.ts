/**
 * Profile type definitions for Personal vs Business profiles
 */

export type ProfileType = 'personal' | 'business';

export type BusinessCategory = 
  | 'golf_club'
  | 'brand'
  | 'coach_academy'
  | 'fitter_retail'
  | 'tour_series'
  | 'other';

export const BUSINESS_CATEGORIES: string[] = [
  'Golf Club',
  'Golf Academy',
  'Coach / Instructor',
  'University / College',
  'Creator',
  'Retailer / Pro Shop',
  'Club Fitter',
  'Resort',
  'Brand / Manufacturer',
  'Other',
];

export interface UserProfileData {
  id: string;
  profile_type: ProfileType;
  display_name: string | null;
  username: string | null;
  home_club?: string | null;
  eg_handicap_index?: number | null;
  profile_photo_url?: string | null;
  header_photo_url?: string | null;
  bio?: string | null;
  location?: string | null;
  is_public?: boolean | null;
  
  // Creator Mode flag (Phase 3.1)
  is_creator?: boolean | null;
  
  // Business-only fields
  business_name?: string | null;
  business_category?: BusinessCategory | null;
  business_website?: string | null;
  business_location?: string | null;
  business_contact_email?: string | null;
  business_contact_phone?: string | null;
  business_bio?: string | null;
  is_business_verified?: boolean | null;
  is_verified_business?: boolean | null;
  verified_business_at?: string | null;
  verified_business_notes?: string | null;
}

/**
 * Get the profile type from a profile, defaulting to 'personal'
 */
export const getProfileType = (profile: { profile_type?: string | null } | null): ProfileType => {
  if (!profile?.profile_type) return 'personal';
  return profile.profile_type === 'business' ? 'business' : 'personal';
};

/**
 * Get the display name for a profile, using business_name for business profiles if available
 */
export const getProfileDisplayName = (profile: {
  profile_type?: string | null;
  display_name?: string | null;
  business_name?: string | null;
} | null): string => {
  if (!profile) return '';
  if (profile.profile_type === 'business' && profile.business_name) {
    return profile.business_name;
  }
  return profile.display_name || '';
};
