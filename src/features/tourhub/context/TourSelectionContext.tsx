/**
 * TourSelectionContext — slimmed to tournament identity broadcast only.
 *
 * The old picker COMMAND flow (selectTour / selectionNonce) was retired in
 * Phase 5A after the global tour picker was destroyed. What remains is the
 * DISPLAY flow: the hero reports which tour + tournament it is currently
 * showing via setViewingTourSlug / setViewingTournamentId, and downstream
 * sections (OnTheCourseSlot, TISlot) read viewingTourSlug / viewingTournamentId
 * to scope themselves to that tournament. Display-only, dead end — the hero
 * must never read these back into its own index.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface TourSelectionValue {
  viewingTourSlug: string | null;
  setViewingTourSlug: (slug: string) => void;
  viewingTournamentId: string | null;
  setViewingTournamentId: (id: string | null) => void;
}

const TourSelectionContext = createContext<TourSelectionValue | null>(null);

export function TourSelectionProvider({ children }: { children: ReactNode }) {
  const [viewingTourSlug, setViewingTourSlugState] = useState<string | null>(null);
  const [viewingTournamentId, setViewingTournamentIdState] = useState<string | null>(null);

  const setViewingTourSlug = useCallback((slug: string) => {
    setViewingTourSlugState((prev) => (prev === slug ? prev : slug));
  }, []);

  const setViewingTournamentId = useCallback((id: string | null) => {
    setViewingTournamentIdState((prev) => (prev === id ? prev : id));
  }, []);

  return (
    <TourSelectionContext.Provider
      value={{
        viewingTourSlug,
        setViewingTourSlug,
        viewingTournamentId,
        setViewingTournamentId,
      }}
    >
      {children}
    </TourSelectionContext.Provider>
  );
}

export function useTourSelection(): TourSelectionValue {
  const ctx = useContext(TourSelectionContext);
  if (!ctx) {
    return {
      viewingTourSlug: null,
      setViewingTourSlug: () => {},
      viewingTournamentId: null,
      setViewingTournamentId: () => {},
    };
  }
  return ctx;
}
