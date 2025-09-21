import React, { createContext, useContext, useState, useCallback } from 'react';

export type HeaderVariant = 'glass-dark';

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

const DEFAULT_VARIANT: HeaderVariant = 'glass-dark';

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ 
  children, 
  defaultVariant = 'glass-dark' 
}) => {
  const [variant] = useState<HeaderVariant>(DEFAULT_VARIANT);
  const [isVisible, setIsVisible] = useState(true);

  // No-op setter to prevent pages from attempting to change variant
  const forceGlassDark = useCallback((v?: any) => {
    if (process.env.NODE_ENV !== 'production' && v && v !== 'glass-dark') {
      console.warn('[Header] Variant is locked to glass-dark. Ignoring:', v);
    }
  }, []);

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
        setVariant: forceGlassDark, 
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