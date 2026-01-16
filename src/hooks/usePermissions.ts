/**
 * usePermissions Hook
 * 
 * Provides permission checks based on the current user context.
 * Works with both personal profiles and business profiles.
 */

import { useMemo } from 'react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useProfileData } from '@/hooks/useProfileData';
import * as permissions from '@/utils/permissions';
import type { ActiveContext, BadgeType } from '@/utils/permissions';

export interface PermissionsResult {
  // Feature access
  canAccessWorldTop100: boolean;
  canAccessFriends: boolean;
  canAccessTop100Club: boolean;
  canAccessTop100FriendsSection: boolean;
  canRateCourses: boolean;
  hasCreatorFeatures: boolean;
  hasPersonalFeatureAccess: boolean;
  isOperatingAsBusiness: boolean;
  isCreatorBusiness: boolean;
  
  // Badge
  badge: BadgeType;
  
  // Hub modules
  hubModules: string[];
  
  // Profile destination
  getProfileTabDestination: () => string;
  
  // Context info
  context: ActiveContext;
}

export const usePermissions = (): PermissionsResult => {
  const { activeActor, availableActors } = useActiveActor();
  const { profile: userProfile } = useProfileData();
  
  // Find business details if operating as business
  const activeBusiness = useMemo(() => {
    if (activeActor?.type !== 'business') return null;
    
    // Get category from meta if available, or try to find in available actors
    const businessActor = availableActors.find(
      a => a.type === 'business' && a.id === activeActor.id
    );
    
    return businessActor ? {
      id: businessActor.id,
      category: businessActor.meta?.category as string | null || null,
      is_verified: businessActor.verified,
    } : null;
  }, [activeActor, availableActors]);
  
  const context: ActiveContext = useMemo(() => ({
    userProfile: userProfile ? {
      id: userProfile.id,
      is_creator: userProfile.is_creator ?? false,
      creator_only: userProfile.creator_only ?? false,
      is_verified: userProfile.is_verified ?? false,
    } : null,
    activeBusinessId: activeActor?.type === 'business' ? activeActor.id : null,
    activeBusiness,
  }), [userProfile, activeActor, activeBusiness]);
  
  return useMemo(() => ({
    // Feature access
    canAccessWorldTop100: permissions.canAccessWorldTop100(context),
    canAccessFriends: permissions.canAccessFriends(context),
    canAccessTop100Club: permissions.canAccessTop100Club(context),
    canAccessTop100FriendsSection: permissions.canAccessTop100FriendsSection(context),
    canRateCourses: permissions.canRateCourses(context),
    hasCreatorFeatures: permissions.hasCreatorFeatures(context),
    hasPersonalFeatureAccess: permissions.hasPersonalFeatureAccess(context),
    isOperatingAsBusiness: permissions.isOperatingAsBusiness(context),
    isCreatorBusiness: permissions.isCreatorBusiness(context),
    
    // Badge
    badge: permissions.getProfileBadge(
      activeActor?.type !== 'business',
      userProfile?.is_verified || false,
      userProfile?.is_creator || false,
      activeBusiness?.category || null
    ),
    
    // Hub modules
    hubModules: permissions.getHubModules(context),
    
    // Profile destination
    getProfileTabDestination: () => permissions.getProfileTabDestination(
      context,
      userProfile?.id || ''
    ),
    
    // Context info
    context,
  }), [context, userProfile, activeActor, activeBusiness]);
};
