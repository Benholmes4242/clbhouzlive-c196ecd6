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
  { id: 'activity', label: 'Activity' },
  { id: 'courses', label: 'Courses' },
  { id: 'top100', label: 'Top 100' },
  { id: 'stats', label: 'Handicap' }
];

/**
 * Business profile tabs - only Activity
 */
export const BUSINESS_TABS = [
  { id: 'activity', label: 'Activity' }
];

/**
 * Get the appropriate tabs for a profile type
 */
export const getProfileTabs = (userType: string | null | undefined) => {
  const { isPersonal } = getProfileType(userType);
  return isPersonal ? PERSONAL_TABS : BUSINESS_TABS;
};
