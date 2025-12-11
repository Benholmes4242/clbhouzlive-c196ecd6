import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProfileData } from '@/hooks/useProfileData';
import { useMyBusinesses } from '@/hooks/useMyBusinesses';

export type ActorType = 'personal' | 'business';

export interface ActiveActor {
  type: ActorType;
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface ActiveActorContextValue {
  activeActor: ActiveActor | null;
  setActiveActor: (actor: ActiveActor) => void;
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
    
    // Add business profiles
    if (businesses) {
      for (const membership of businesses) {
        if (membership.business && ['owner', 'admin', 'editor'].includes(membership.role)) {
          actors.push({
            type: 'business',
            id: membership.business.id,
            name: membership.business.name,
            avatarUrl: membership.business.logo_url,
          });
        }
      }
    }
    
    return actors;
  }, [profile, businesses]);

  // Initialize from localStorage or default to personal
  useEffect(() => {
    if (profileLoading || businessesLoading || initialized) return;
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
  }, [profile, profileLoading, businessesLoading, availableActors, initialized]);

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
      freshActor.name !== activeActor.name
    )) {
      setActiveActorState(freshActor);
    }
  }, [availableActors, activeActor, initialized]);

  // Persist to localStorage
  useEffect(() => {
    if (activeActor) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeActor));
    }
  }, [activeActor]);

  const setActiveActor = (actor: ActiveActor) => {
    // Validate actor is in available list
    const isValid = availableActors.some(
      a => a.type === actor.type && a.id === actor.id
    );
    if (isValid) {
      setActiveActorState(actor);
    }
  };

  return (
    <ActiveActorContext.Provider
      value={{
        activeActor,
        setActiveActor,
        availableActors,
        isLoading: profileLoading || businessesLoading || !initialized,
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
