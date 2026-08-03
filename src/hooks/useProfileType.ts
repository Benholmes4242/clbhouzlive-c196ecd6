/**
 * Profile type detection hook
 * Returns whether a profile is personal (individual golfer) or business (club/brand/creator)
 */

export type ProfileType = 'personal' | 'business';

export interface ProfileTypeInfo {
  type: ProfileType;
  isPersonal: boolean;
  isBusiness: boolean;
  userType: string | null | undefined;
}

/**
 * Determines the profile type based on user_type field
 * Personal: 'individual' or 'personal' (or null for legacy users)
 * Business: 'club', 'brand', 'creator', or any other type
 */
export const getProfileType = (userType: string | null | undefined): ProfileTypeInfo => {
  const isPersonal = !userType || userType === 'individual' || userType === 'personal';
  
  return {
    type: isPersonal ? 'personal' : 'business',
    isPersonal,
    isBusiness: !isPersonal,
    userType
  };
};

/**
 * Personal profile tabs - Activity, Courses, Top 100, Handicap
 */
export const PERSONAL_TABS = [
  { id: 'activity', label: 'Posts' },
  { id: 'courses', label: 'Courses' },
  { id: 'stats', label: 'Handicap' }
];

/**
 * Fallback tabs for a non-individual user_type rendered on the PERSONAL
 * profile page. The business profile page (BusinessProfilePage) owns its own
 * Posts / About / Team definition and never reads this file, so nothing here
 * should be mistaken for the shipped business tab set.
 */
export const NON_PERSONAL_FALLBACK_TABS = [
  { id: 'activity', label: 'Posts' }
];

/**
 * Get the appropriate tabs for a profile type
 */
export const getProfileTabs = (userType: string | null | undefined) => {
  const { isPersonal } = getProfileType(userType);
  return isPersonal ? PERSONAL_TABS : NON_PERSONAL_FALLBACK_TABS;
};

