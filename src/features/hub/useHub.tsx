/**
 * Hub Context & Provider
 * Manages Hub page navigation (standard routing, no overlay)
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

  // Navigate to Hub as a standard page (no background location overlay)
  const open = () => {
    nav('/hub');
  };

  // Navigate from Hub to another page
  const navigateFromHub = (to: string) => {
    nav(to);
  };

  // Close Hub by going back or to clubhouse
  const close = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hub_closed', {
        event_category: 'hub',
        event_label: 'Hub closed',
      });
    }

    // Try to go back if there's history, otherwise go to clubhouse
    if (window.history.length > 1) {
      nav(-1);
    } else {
      nav('/clubhouse', { replace: true });
    }
  };

  // Centralized hub-open class management for styling
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
