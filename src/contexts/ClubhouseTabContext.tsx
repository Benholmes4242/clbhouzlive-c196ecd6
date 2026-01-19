import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabContextType {
  activeTab: ClubhouseTab;
  setActiveTab: (tab: ClubhouseTab) => void;
}

const ClubhouseTabContext = createContext<ClubhouseTabContextType | null>(null);

export const useClubhouseTab = () => {
  return useContext(ClubhouseTabContext);
};

interface ClubhouseTabProviderProps {
  children: ReactNode;
}

export const ClubhouseTabProvider = ({ children }: ClubhouseTabProviderProps) => {
  const [activeTab, setActiveTabState] = useState<ClubhouseTab>(() => {
    // Persist tab choice in session
    const stored = sessionStorage.getItem('clubhouse-tab');
    return (stored === 'foryou' || stored === 'friends') ? stored : 'foryou';
  });

  const setActiveTab = useCallback((tab: ClubhouseTab) => {
    setActiveTabState(tab);
    sessionStorage.setItem('clubhouse-tab', tab);
  }, []);

  return (
    <ClubhouseTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ClubhouseTabContext.Provider>
  );
};
