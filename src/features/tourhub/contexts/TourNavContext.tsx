/**
 * TourNavContext - Manages tour navigation overlay state
 * Uses custom events to allow global header to trigger the tour nav menu
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Custom event name for opening tour nav
export const TOUR_NAV_OPEN_EVENT = 'tour-nav-open';

// Helper to dispatch the open event from anywhere
export function openTourNav() {
  window.dispatchEvent(new CustomEvent(TOUR_NAV_OPEN_EVENT));
}

interface TourNavContextType {
  isNavOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
}

const TourNavContext = createContext<TourNavContextType | undefined>(undefined);

export function useTourNav() {
  const context = useContext(TourNavContext);
  if (!context) {
    // Return a no-op version for non-tour pages
    return {
      isNavOpen: false,
      openNav: () => {},
      closeNav: () => {},
    };
  }
  return context;
}

interface TourNavProviderProps {
  children: React.ReactNode;
}

export function TourNavProvider({ children }: TourNavProviderProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const openNav = useCallback(() => {
    setIsNavOpen(true);
  }, []);

  const closeNav = useCallback(() => {
    setIsNavOpen(false);
  }, []);

  // Listen for global event to open nav
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsNavOpen(true);
    };
    
    window.addEventListener(TOUR_NAV_OPEN_EVENT, handleOpenEvent);
    return () => window.removeEventListener(TOUR_NAV_OPEN_EVENT, handleOpenEvent);
  }, []);

  return (
    <TourNavContext.Provider value={{ isNavOpen, openNav, closeNav }}>
      {children}
    </TourNavContext.Provider>
  );
}
