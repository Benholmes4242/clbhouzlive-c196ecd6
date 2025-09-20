import React, { createContext, useContext, useState, ReactNode } from 'react';

export type HeaderVariant = 'glass-dark' | 'solid-light';

interface HeaderContextType {
  variant: HeaderVariant;
  setVariant: (variant: HeaderVariant) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const useHeaderVariant = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeaderVariant must be used within a HeaderProvider');
  }
  return context;
};

interface HeaderProviderProps {
  children: ReactNode;
  defaultVariant?: HeaderVariant;
}

export const HeaderProvider = ({ children, defaultVariant = 'glass-dark' }: HeaderProviderProps) => {
  const [variant, setVariant] = useState<HeaderVariant>(defaultVariant);

  return (
    <HeaderContext.Provider value={{ variant, setVariant }}>
      {children}
    </HeaderContext.Provider>
  );
};