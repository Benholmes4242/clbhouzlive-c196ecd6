/**
 * Hub Context & Provider
 * Manages Hub navigation (now uses normal page navigation, no overlays)
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

  // Navigate to Hub as a normal page (no overlay)
  const open = () => {
    nav('/hub');
  };

  // Navigate from Hub to another page (normal navigation)
  const navigateFromHub = (to: string) => {
    nav(to);
  };

  // Close Hub - navigate back or to clubhouse
  const close = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hub_closed', {
        event_category: 'hub',
        event_label: 'Hub closed',
      });
    }

    // Try to go back, or navigate to clubhouse as fallback
    if (window.history.length > 1) {
      nav(-1);
    } else {
      nav('/clubhouse', { replace: true });
    }
  };

  // Track hub-open class for styling purposes
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
