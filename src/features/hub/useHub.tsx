/**
 * Hub Context & Provider
 * Manages Hub overlay state and navigation
 */

import React, { createContext, useContext, useState } from 'react';
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
  const nav = useNavigate();
  const loc = useLocation();

  const open = () => {
    setOrigin(loc);
    setIsOpen(true);
    nav('/hub', { state: { backgroundLocation: loc } });
  };

  const close = () => {
    setIsOpen(false);
    if (origin) {
      nav(origin.pathname, { replace: true });
    }
  };

  const navigateFromHub = (to: string) => {
    const backgroundLocation = origin ?? loc;
    setIsOpen(false);
    nav(to, { state: { backgroundLocation, fromHub: true } });
  };

  return (
    <HubContext.Provider value={{ isOpen, origin, open, close, navigateFromHub }}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within HubProvider');
  return ctx;
}
