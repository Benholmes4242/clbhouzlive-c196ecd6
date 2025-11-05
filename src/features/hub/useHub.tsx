/**
 * Hub Context - Centralized Hub state management
 * 
 * Provides open/close control and navigation helpers that hide Hub before routing.
 * This prevents Hub from stacking above itself when navigating to full-screen pages.
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type HubCtx = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  navigateFromHub: (to: string, opts?: { replace?: boolean }) => void;
};

const Ctx = React.createContext<HubCtx>(null as any);

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = React.useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const [origin, setOrigin] = React.useState<string>(loc.pathname);

  const open = () => {
    setOrigin(loc.pathname); // remember what was under the Hub
    document.documentElement.classList.add('hub-open');
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    document.documentElement.classList.remove('hub-open');
  };

  // One helper that hides the Hub THEN navigates
  const navigateFromHub = (to: string, opts?: { replace?: boolean }) => {
    // 1) hide/unmount Hub immediately
    close();
    // 2) navigate to full-screen page directly above the origin page
    nav(to, { replace: opts?.replace });
  };

  return (
    <Ctx.Provider value={{ isOpen, open, close, navigateFromHub }}>
      {children}
    </Ctx.Provider>
  );
}

export const useHub = () => React.useContext(Ctx);
