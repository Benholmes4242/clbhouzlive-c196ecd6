/**
 * FeatureGuard - Protect routes and UI based on permissions
 * 
 * Usage:
 * <FeatureGuard feature="worldTop100" redirectTo="/courses">
 *   <WorldTop100Page />
 * </FeatureGuard>
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

type FeatureKey = 
  | 'worldTop100' 
  | 'friends' 
  | 'top100Club' 
  | 'top100FriendsSection'
  | 'courseRating'
  | 'creatorFeatures'
  | 'personalFeatures';

interface FeatureGuardProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const FeatureGuard = ({ 
  feature, 
  children, 
  fallback = null,
  redirectTo 
}: FeatureGuardProps) => {
  const permissions = usePermissions();
  
  const permissionMap: Record<FeatureKey, boolean> = {
    worldTop100: permissions.canAccessWorldTop100,
    friends: permissions.canAccessFriends,
    top100Club: permissions.canAccessTop100Club,
    top100FriendsSection: permissions.canAccessTop100FriendsSection,
    courseRating: permissions.canRateCourses,
    creatorFeatures: permissions.hasCreatorFeatures,
    personalFeatures: permissions.hasPersonalFeatureAccess,
  };
  
  const hasAccess = permissionMap[feature];
  
  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * PersonalOnlyGuard - Convenience wrapper for personal-only routes
 * Redirects to /hub if user is operating as business or in creator_only mode
 */
interface PersonalOnlyGuardProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export const PersonalOnlyGuard = ({ 
  children, 
  redirectTo = '/hub',
  fallback
}: PersonalOnlyGuardProps) => {
  const { hasPersonalFeatureAccess } = usePermissions();
  
  if (!hasPersonalFeatureAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * CreatorOnlyGuard - For creator-specific features like insights
 * Available to Personal+Creator Mode OR Business with Creator category
 */
interface CreatorOnlyGuardProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export const CreatorOnlyGuard = ({ 
  children, 
  redirectTo = '/',
  fallback
}: CreatorOnlyGuardProps) => {
  const { hasCreatorFeatures } = usePermissions();
  
  if (!hasCreatorFeatures) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * useFeatureAccess - Hook for conditional rendering without redirect
 * 
 * Usage:
 * const { canAccess } = useFeatureAccess('worldTop100');
 * if (canAccess) { ... }
 */
export const useFeatureAccess = (feature: FeatureKey): { canAccess: boolean } => {
  const permissions = usePermissions();
  
  const permissionMap: Record<FeatureKey, boolean> = {
    worldTop100: permissions.canAccessWorldTop100,
    friends: permissions.canAccessFriends,
    top100Club: permissions.canAccessTop100Club,
    top100FriendsSection: permissions.canAccessTop100FriendsSection,
    courseRating: permissions.canRateCourses,
    creatorFeatures: permissions.hasCreatorFeatures,
    personalFeatures: permissions.hasPersonalFeatureAccess,
  };
  
  return { canAccess: permissionMap[feature] };
};
