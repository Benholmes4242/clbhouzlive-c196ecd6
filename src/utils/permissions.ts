/**
 * Permission Utilities
 *
 * Note: Personal "Creator Mode" has been fully removed. The only creator-like
 * concept that still exists is a Business profile with category === 'Creator',
 * which is purely informational (no gated features tied to it anymore).
 */

export type ProfileType = 'personal' | 'business';
export type BusinessCategory = 'Golf Club' | 'University / College' | 'Creator' | string;

export interface UserProfile {
  id: string;
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
 * Blocked only when actively using a business profile.
 */
export const hasPersonalFeatureAccess = (context: ActiveContext): boolean => {
  if (context.activeBusinessId) return false;
  return true;
};

// Specific permission checks
export const canAccessWorldTop100 = (context: ActiveContext): boolean =>
  hasPersonalFeatureAccess(context);

export const canAccessFriends = (context: ActiveContext): boolean =>
  hasPersonalFeatureAccess(context);

export const canAccessTop100Club = (context: ActiveContext): boolean =>
  hasPersonalFeatureAccess(context);

export const canAccessTop100FriendsSection = (context: ActiveContext): boolean =>
  hasPersonalFeatureAccess(context);

export const canRateCourses = (context: ActiveContext): boolean =>
  hasPersonalFeatureAccess(context);

/**
 * Badge selection
 */
export type BadgeType = 'golfer' | null;

export const getProfileBadge = (
  isPersonal: boolean,
  isVerified: boolean,
): BadgeType => {
  if (isPersonal && isVerified) return 'golfer';
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
  userId: string,
): string => {
  if (context.activeBusinessId) {
    return `/business/${context.activeBusinessId}`;
  }
  return `/profile/${userId}`;
};

/**
 * Check if a user is currently operating as a business
 */
export const isOperatingAsBusiness = (context: ActiveContext): boolean =>
  Boolean(context.activeBusinessId);
