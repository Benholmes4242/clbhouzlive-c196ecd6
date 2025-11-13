/**
 * Hub Context & Provider
 * Manages Hub overlay navigation
 */

import React, { createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type HubContextType = {
  open: () => void;
  navigateFromHub: (to: string) => void;
};

const HubContext = createContext<HubContextType | null>(null);

export function HubProvider({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const loc = useLocation();

  const open = () => {
    nav('/hub', { state: { backgroundLocation: loc } });
  };

  const navigateFromHub = (to: string) => {
    const backgroundLocation = (loc.state as any)?.backgroundLocation || loc;
    // Navigate to target page as an overlay over origin (not over Hub)
    nav(to, { state: { backgroundLocation } });
  };

  return (
    <HubContext.Provider value={{ open, navigateFromHub }}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within HubProvider');
  return ctx;
}
