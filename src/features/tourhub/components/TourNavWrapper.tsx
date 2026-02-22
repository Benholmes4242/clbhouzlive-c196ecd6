/**
 * TourNavWrapper — Provides TourNavProvider + TourHubNavOverlay
 * for standalone Tour Hub pages that live outside TourHubMainPage.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TourNavProvider, useTourNav } from '../contexts/TourNavContext';
import { TourHubNavOverlay } from './TourHubNavOverlay';

function TourNavInner({ children }: { children: React.ReactNode }) {
  const { isNavOpen, closeNav } = useTourNav();
  const navigate = useNavigate();

  return (
    <>
      {children}
      <TourHubNavOverlay
        isOpen={isNavOpen}
        onClose={closeNav}
        activeTab="overview"
        onNavigate={(tab) => {
          navigate(`/tourhub?tab=${tab}`, { replace: true });
          closeNav();
        }}
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
