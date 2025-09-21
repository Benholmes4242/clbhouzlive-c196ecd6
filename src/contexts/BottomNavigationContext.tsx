import React, { createContext, useContext, useState, useCallback } from 'react';

interface BottomNavigationContextType {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  hideBottomNav: () => void;
  showBottomNav: () => void;
}

const BottomNavigationContext = createContext<BottomNavigationContextType | undefined>(undefined);

export const useBottomNavigation = () => {
  const context = useContext(BottomNavigationContext);
  if (!context) {
    throw new Error('useBottomNavigation must be used within a BottomNavigationProvider');
  }
  return context;
};

interface BottomNavigationProviderProps {
  children: React.ReactNode;
}

export const BottomNavigationProvider: React.FC<BottomNavigationProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);

  const setVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  const hideBottomNav = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showBottomNav = useCallback(() => {
    setIsVisible(true);
  }, []);

  return (
    <BottomNavigationContext.Provider 
      value={{ 
        isVisible, 
        setVisible, 
        hideBottomNav, 
        showBottomNav 
      }}
    >
      {children}
    </BottomNavigationContext.Provider>
  );
};