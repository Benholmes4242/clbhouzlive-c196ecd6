/**
 * TourNavWrapper — Provides TourNavProvider + TourHubNavOverlay
 * for standalone Tour Hub pages that live outside TourHubMainPage.
 */

import React from 'react';
import { TourNavProvider, useTourNav } from '../contexts/TourNavContext';
import { TourHubNavOverlay } from './TourHubNavOverlay';

function TourNavInner({ children }: { children: React.ReactNode }) {
  const { isNavOpen, closeNav } = useTourNav();

  return (
    <>
      {children}
      <TourHubNavOverlay
        isOpen={isNavOpen}
        onClose={closeNav}
        activeTab="overview"
        onNavigate={() => {}}
      />
    </>
  );
}

export function TourNavWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TourNavProvider>
      <TourNavInner>{children}</TourNavInner>
    </TourNavProvider>
  );
}
