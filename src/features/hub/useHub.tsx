/**
 * Hub Context & Hook
 * 
 * Centralized state management for Hub overlay system:
 * - Tracks origin page (where Hub was opened from)
 * - Controls Hub visibility
 * - Manages navigation between Hub and Hub pages
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLocation, useNavigate, Location } from 'react-router-dom';

type HubContextType = {
  isOpen: boolean;
  origin?: Location;
  open: () => void;
  close: () => void;
  navigateFromHub: (to: string) => void;
};

const HubContext = createContext<HubContextType | null>(null);

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [origin, setOrigin] = useState<Location | undefined>(undefined);
  const navigate = useNavigate();
  const location = useLocation();

  const open = useCallback(() => {
    // Remember where Hub was opened from (Clubhouse, Courses, Discover, etc.)
    setOrigin(location);
    document.documentElement.classList.add('hub-open');
    setIsOpen(true);
    // Route to the Hub overlay with background set to origin
    navigate('/hub', { state: { backgroundLocation: location } });
  }, [location, navigate]);

  const close = useCallback(() => {
    setIsOpen(false);
    document.documentElement.classList.remove('hub-open');
    // Return to the origin page (whatever the user was on)
    if (origin) {
      navigate(origin, { replace: true });
    }
  }, [origin, navigate]);

  // Hide Hub and navigate to a Hub page (Echo, Swing, etc.) above the same origin
  const navigateFromHub = useCallback((to: string) => {
    const backgroundLocation = origin ?? location;
    setIsOpen(false);
    document.documentElement.classList.remove('hub-open');
    navigate(to, { state: { backgroundLocation, fromHub: true } });
  }, [origin, location, navigate]);

  return (
    <HubContext.Provider value={{ isOpen, origin, open, close, navigateFromHub }}>
      {children}
    </HubContext.Provider>
  );
}

export const useHub = () => {
  const context = useContext(HubContext);
  if (!context) {
    throw new Error('useHub must be used within HubProvider');
  }
  return context;
};
