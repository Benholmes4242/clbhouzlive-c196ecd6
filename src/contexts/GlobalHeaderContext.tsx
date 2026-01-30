import React, { createContext, useContext, useState, useCallback } from 'react';

export type HeaderVariant = 'glass-dark' | 'solid-light' | 'cinematic';

interface HeaderContextType {
  variant: HeaderVariant;
  setVariant: (variant: HeaderVariant) => void;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  hideHeader: () => void;
  showHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};

// Legacy hook for backward compatibility
export const useHeaderVariant = () => {
  const { variant, setVariant } = useHeader();
  return { variant, setVariant };
};

interface HeaderProviderProps {
  children: React.ReactNode;
  defaultVariant?: HeaderVariant;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ 
  children, 
  defaultVariant = 'solid-light' 
}) => {
  const [variant, setVariant] = useState<HeaderVariant>(defaultVariant);
  const [isVisible, setIsVisible] = useState(true);

  const setVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  const hideHeader = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showHeader = useCallback(() => {
    setIsVisible(true);
  }, []);

  return (
    <HeaderContext.Provider 
      value={{ 
        variant, 
        setVariant, 
        isVisible, 
        setVisible, 
        hideHeader, 
        showHeader 
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
};