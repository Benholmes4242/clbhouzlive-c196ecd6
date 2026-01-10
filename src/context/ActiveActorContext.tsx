import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProfileData } from '@/hooks/useProfileData';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';
import { useMyCreators, CREATOR_POSTING_ROLES } from '@/hooks/useMyCreators';
import { ActorType, ActiveActor, SetActorOptions } from '@/types/actor';

// Re-export types for backwards compatibility
export type { ActorType, ActiveActor, SetActorOptions } from '@/types/actor';

interface ActiveActorContextValue {
  activeActor: ActiveActor | null;
  setActiveActor: (actor: ActiveActor, options?: SetActorOptions) => void;
  availableActors: ActiveActor[];
  isLoading: boolean;
}

const ActiveActorContext = createContext<ActiveActorContextValue | undefined>(undefined);

const STORAGE_KEY = 'clbhouz_active_actor';

export function ActiveActorProvider({ children }: { children: ReactNode }) {
  const profileData = useProfileData();
  const profile = profileData.profile;
  const profileLoading = profileData.loading;
  const { data: businesses, isLoading: businessesLoading } = useMyBusinesses(profile?.id);
  const { data: creators, isLoading: creatorsLoading } = useMyCreators(profile?.id);
  
  const [activeActor, setActiveActorState] = useState<ActiveActor | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Build available actors list
  const availableActors: ActiveActor[] = React.useMemo(() => {
    const actors: ActiveActor[] = [];
    
    // Personal profile is always first
    if (profile) {
      actors.push({
        type: 'personal',
        id: profile.id,
        name: profile.display_name || profile.username || 'Personal',
        avatarUrl: profile.profile_photo_url,
      });
    }
    
    // Add creator pages (owner/admin/editor can post)
    if (creators) {
      for (const membership of creators) {
        if (membership.creatorPage && CREATOR_POSTING_ROLES.includes(membership.role)) {
          actors.push({
            type: 'creator',
            id: membership.creatorPage.id,
            name: membership.creatorPage.display_name,
            avatarUrl: membership.creatorPage.avatar_url,
            slug: membership.creatorPage.slug,
            verified: membership.creatorPage.is_verified,
          });
        }
      }
    }
    
    // Add business profiles
    if (businesses) {
      for (const membership of businesses) {
        if (membership.business && ['owner', 'admin', 'editor'].includes(membership.role)) {
          actors.push({
            type: 'business',
            id: membership.business.id,
            name: membership.business.name,
            avatarUrl: membership.business.logo_url,
            slug: membership.business.slug,
            verified: membership.business.is_verified,
          });
        }
      }
    }
    
    return actors;
  }, [profile, businesses, creators]);

  // Initialize from localStorage or default to personal
  useEffect(() => {
    if (profileLoading || businessesLoading || creatorsLoading || initialized) return;
    if (!profile) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ActiveActor;
        // Verify the stored actor is still valid
        const isValid = availableActors.some(
          a => a.type === parsed.type && a.id === parsed.id
        );
        if (isValid) {
          setActiveActorState(parsed);
          setInitialized(true);
          return;
        }
      } catch {
        // Invalid stored data, fall through to default
      }
    }

    // Default to personal profile
    const personal = availableActors.find(a => a.type === 'personal');
    if (personal) {
      setActiveActorState(personal);
    }
    setInitialized(true);
  }, [profile, profileLoading, businessesLoading, creatorsLoading, availableActors, initialized]);

  // Keep activeActor in sync with fresh availableActors data (avatar/name changes)
  useEffect(() => {
    if (!activeActor || !initialized) return;
    
    // Find the matching fresh actor from availableActors
    const freshActor = availableActors.find(
      a => a.type === activeActor.type && a.id === activeActor.id
    );
    
    // If found and data differs, update to fresh values
    if (freshActor && (
      freshActor.avatarUrl !== activeActor.avatarUrl ||
      freshActor.name !== activeActor.name ||
      freshActor.slug !== activeActor.slug ||
      freshActor.verified !== activeActor.verified
    )) {
      setActiveActorState(freshActor);
    }
  }, [availableActors, activeActor, initialized]);

  // Track if current selection should be persisted
  const [shouldPersist, setShouldPersist] = useState(true);

  // Persist to localStorage only when shouldPersist is true
  useEffect(() => {
    if (activeActor && shouldPersist) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeActor));
    }
  }, [activeActor, shouldPersist]);

  const setActiveActor = (actor: ActiveActor, options?: SetActorOptions) => {
    const persist = options?.persist !== false; // Default to true
    
    // Validate actor is in available list
    const isValid = availableActors.some(
      a => a.type === actor.type && a.id === actor.id
    );
    if (isValid) {
      setShouldPersist(persist);
      setActiveActorState(actor);
      
      // If persisting, update localStorage immediately
      if (persist) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(actor));
      }
    }
  };

  return (
    <ActiveActorContext.Provider
      value={{
        activeActor,
        setActiveActor,
        availableActors,
        isLoading: profileLoading || businessesLoading || creatorsLoading || !initialized,
      }}
    >
      {children}
    </ActiveActorContext.Provider>
  );
}

export function useActiveActor() {
  const context = useContext(ActiveActorContext);
  if (!context) {
    throw new Error('useActiveActor must be used within ActiveActorProvider');
  }
  return context;
}
