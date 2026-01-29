import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useActiveActor } from '@/context/ActiveActorContext';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabContextType {
  activeTab: ClubhouseTab;
  setActiveTab: (tab: ClubhouseTab) => void;
  isBusinessActor: boolean;
}

const ClubhouseTabContext = createContext<ClubhouseTabContextType | null>(null);

export const useClubhouseTab = () => {
  return useContext(ClubhouseTabContext);
};

interface ClubhouseTabProviderProps {
  children: ReactNode;
}

export const ClubhouseTabProvider = ({ children }: ClubhouseTabProviderProps) => {
  const { activeActor } = useActiveActor();
  const isBusinessActor = activeActor?.type === 'business';
  
  const [activeTab, setActiveTabState] = useState<ClubhouseTab>(() => {
    // Persist tab choice in session
    const stored = sessionStorage.getItem('clubhouse-tab');
    return (stored === 'foryou' || stored === 'friends') ? stored : 'foryou';
  });

  // Auto-redirect to 'foryou' if user is on 'friends' tab and switches to business mode
  useEffect(() => {
    if (isBusinessActor && activeTab === 'friends') {
      setActiveTabState('foryou');
      sessionStorage.setItem('clubhouse-tab', 'foryou');
    }
  }, [isBusinessActor, activeTab]);

  const setActiveTab = useCallback((tab: ClubhouseTab) => {
    // Prevent setting to 'friends' when in business mode
    if (tab === 'friends' && isBusinessActor) {
      return;
    }
    setActiveTabState(tab);
    sessionStorage.setItem('clubhouse-tab', tab);
  }, [isBusinessActor]);

  return (
    <ClubhouseTabContext.Provider value={{ activeTab, setActiveTab, isBusinessActor }}>
      {children}
    </ClubhouseTabContext.Provider>
  );
};
