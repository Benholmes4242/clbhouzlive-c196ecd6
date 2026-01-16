/**
 * Permission Utilities for Creator Dual-Path Architecture
 * 
 * Two Creator Paths:
 * - Path A: Business Creator (category = 'Creator') - Teams, brands, agencies
 * - Path B: Creator Mode (is_creator = true) - Individual content creators
 */

export type ProfileType = 'personal' | 'business';
export type BusinessCategory = 'Golf Club' | 'University / College' | 'Creator' | string;

export interface UserProfile {
  id: string;
  is_creator?: boolean;
  creator_only?: boolean;
  is_verified?: boolean;
}

export interface BusinessProfile {
  id: string;
  category?: BusinessCategory | null;
  is_verified?: boolean;
}

export interface ActiveContext {
  userProfile: UserProfile | null;
  activeBusinessId?: string | null;
  activeBusiness?: BusinessProfile | null;
}

/**
 * Check if user has access to personal-only features
 * Blocked for: Active business profile OR creator_only mode
 */
export const hasPersonalFeatureAccess = (context: ActiveContext): boolean => {
  // If actively using a business profile, no personal features
  if (context.activeBusinessId) {
    return false;
  }
  // If personal profile with creator_only enabled, no personal features
  if (context.userProfile?.creator_only) {
    return false;
  }
  return true;
};

// Specific permission checks
export const canAccessWorldTop100 = (context: ActiveContext): boolean => {
  return hasPersonalFeatureAccess(context);
};

export const canAccessFriends = (context: ActiveContext): boolean => {
  return hasPersonalFeatureAccess(context);
};

export const canAccessTop100Club = (context: ActiveContext): boolean => {
  return hasPersonalFeatureAccess(context);
};

export const canAccessTop100FriendsSection = (context: ActiveContext): boolean => {
  return hasPersonalFeatureAccess(context);
};

export const canRateCourses = (context: ActiveContext): boolean => {
  return hasPersonalFeatureAccess(context);
};

/**
 * Check if user has Creator features (Insights, Analytics, etc.)
 * Available to: Personal with is_creator=true OR Business with category='Creator'
 */
export const hasCreatorFeatures = (context: ActiveContext): boolean => {
  // Personal profile with Creator Mode enabled
  if (!context.activeBusinessId && context.userProfile?.is_creator) {
    return true;
  }
  // Business profile with Creator category
  if (context.activeBusinessId && context.activeBusiness?.category === 'Creator') {
    return true;
  }
  return false;
};

/**
 * Determine which badge to show
 */
export type BadgeType = 'golfer' | 'creator' | null;

export const getProfileBadge = (
  isPersonal: boolean,
  isVerified: boolean,
  isCreator: boolean,
  businessCategory?: string | null
): BadgeType => {
  // Personal with Creator Mode gets orange Creator badge
  if (isPersonal && isCreator) {
    return 'creator';
  }
  // Personal verified (non-creator) gets green Golfer badge
  if (isPersonal && isVerified && !isCreator) {
    return 'golfer';
  }
  // Business with Creator category gets orange Creator badge
  if (!isPersonal && businessCategory === 'Creator') {
    return 'creator';
  }
  // All other business types - no badge
  return null;
};

/**
 * Get Hub modules for current context
 */
export const getHubModules = (context: ActiveContext): string[] => {
  const baseModules = ['messages', 'echo', 'games', 'trips', 'schedule'];
  
  if (hasPersonalFeatureAccess(context)) {
    return [...baseModules, 'friends'];
  }
  
  return baseModules;
};

/**
 * Determine where Profile tab should navigate
 */
export const getProfileTabDestination = (
  context: ActiveContext,
  userId: string
): string => {
  // Active business profile → business profile page
  if (context.activeBusinessId) {
    return `/business/${context.activeBusinessId}`;
  }
  // Personal profile → profile page
  return `/profile/${userId}`;
};

/**
 * Check if a user is currently operating as a business
 */
export const isOperatingAsBusiness = (context: ActiveContext): boolean => {
  return Boolean(context.activeBusinessId);
};

/**
 * Check if the active context is a Creator-type business
 */
export const isCreatorBusiness = (context: ActiveContext): boolean => {
  return Boolean(
    context.activeBusinessId && 
    context.activeBusiness?.category === 'Creator'
  );
};
