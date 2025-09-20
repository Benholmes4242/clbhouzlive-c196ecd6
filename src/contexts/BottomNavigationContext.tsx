import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BottomNavigationContextType {
  isVisible: boolean;
  variant: 'default' | 'clubhouse';
  setVisible: (visible: boolean) => void;
  setVariant: (variant: 'default' | 'clubhouse') => void;
}

const BottomNavigationContext = createContext<BottomNavigationContextType | undefined>(undefined);

interface BottomNavigationProviderProps {
  children: ReactNode;
}

export const BottomNavigationProvider: React.FC<BottomNavigationProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [variant, setVariantState] = useState<'default' | 'clubhouse'>('default');

  const setVisible = (visible: boolean) => {
    setIsVisible(visible);
  };

  const setVariant = (newVariant: 'default' | 'clubhouse') => {
    setVariantState(newVariant);
  };

  return (
    <BottomNavigationContext.Provider
      value={{
        isVisible,
        variant,
        setVisible,
        setVariant,
      }}
    >
      {children}
    </BottomNavigationContext.Provider>
  );
};

export const useBottomNavigation = () => {
  const context = useContext(BottomNavigationContext);
  if (context === undefined) {
    throw new Error('useBottomNavigation must be used within a BottomNavigationProvider');
  }
  return context;
};