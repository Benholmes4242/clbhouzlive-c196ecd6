import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface BottomNavigationContextType {
  isVisible: boolean;
  height: number;
  setVisible: (visible: boolean) => void;
  hideBottomNav: () => void;
  showBottomNav: () => void;
  setNavRef: (ref: HTMLDivElement | null) => void;
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
  const [height, setHeight] = useState(0);
  const navRef = useRef<HTMLDivElement | null>(null);
  const [navEl, setNavEl] = useState<HTMLDivElement | null>(null);

  const setVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  const hideBottomNav = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showBottomNav = useCallback(() => {
    setIsVisible(true);
  }, []);

  const setNavRef = useCallback((ref: HTMLDivElement | null) => {
    navRef.current = ref;
    setNavEl(ref);
  }, []);

  // Measure bottom nav height with ResizeObserver
  useEffect(() => {
    if (!navEl) return;
    
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.target instanceof HTMLElement
        ? entries[0].target.getBoundingClientRect().height
        : (entries[0]?.contentRect?.height ?? 0);
      setHeight(h);
      document.documentElement.style.setProperty('--bottom-nav-height', `${h}px`);
    });
    
    ro.observe(navEl);
    return () => ro.disconnect();
  }, [navEl]);

  return (
    <BottomNavigationContext.Provider 
      value={{ 
        isVisible, 
        height,
        setVisible, 
        hideBottomNav, 
        showBottomNav,
        setNavRef
      }}
    >
      {children}
    </BottomNavigationContext.Provider>
  );
};