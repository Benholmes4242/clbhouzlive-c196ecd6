/**
 * Hub Context & Provider
 * Manages Hub overlay navigation
 */

import React, { createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type HubContextType = {
  open: () => void;
  navigateFromHub: (to: string) => void;
  close: () => void;
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
    nav(to, { state: { backgroundLocation, fromHub: true } });
  };

  const close = () => {
    const state = loc.state as any;
    const backgroundLocation = state?.backgroundLocation;

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hub_closed', {
        event_category: 'hub',
        event_label: 'Hub closed',
      });
    }

    if (backgroundLocation) {
      nav(backgroundLocation.pathname + backgroundLocation.search, {
        replace: true,
      });
    } else {
      // Fallback if no background location is found
      nav('/clubhouse', { replace: true });
    }
  };

  // Centralized hub-open class management to prevent race conditions
  React.useEffect(() => {
    const isHubRoute = loc.pathname.startsWith('/hub');
    
    if (isHubRoute) {
      document.documentElement.classList.add('hub-open');
    } else {
      document.documentElement.classList.remove('hub-open');
    }

    return () => {
      document.documentElement.classList.remove('hub-open');
    };
  }, [loc.pathname]);

  return (
    <HubContext.Provider value={{ open, navigateFromHub, close }}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within HubProvider');
  return ctx;
}
