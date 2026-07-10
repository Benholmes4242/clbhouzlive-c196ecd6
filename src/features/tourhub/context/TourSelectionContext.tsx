/**
 * TourSelectionContext — channels between the tour switcher and the hero.
 *
 * TWO DISTINCT, NON-CIRCULAR FLOWS (this separation is what prevents the old
 * parent<->hero flashing deadlock from returning):
 *
 *  1. COMMAND (switcher → hero):  selectTour(slug) bumps selectionNonce; the
 *     hero's jump effect keys ONLY on selectionNonce and moves its index.
 *
 *  2. DISPLAY (hero → switcher + downstream):  setViewingTourSlug /
 *     setViewingTournamentId report whichever tour + tournament the hero is
 *     currently showing. The switcher reads viewingTourSlug for its LABEL
 *     only; Tournament Intelligence reads viewingTournamentId so its picks
 *     always match the hero. The hero must NEVER read these back into its
 *     own index — display-only, dead end.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface TourSelectionValue {
  selectedTourSlug: string | null;
  selectionNonce: number;
  selectTour: (slug: string) => void;
  viewingTourSlug: string | null;
  setViewingTourSlug: (slug: string) => void;
  viewingTournamentId: string | null;
  setViewingTournamentId: (id: string | null) => void;
}

const TourSelectionContext = createContext<TourSelectionValue | null>(null);

export function TourSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);
  const [viewingTourSlug, setViewingTourSlugState] = useState<string | null>(null);
  const [viewingTournamentId, setViewingTournamentIdState] = useState<string | null>(null);

  const selectTour = useCallback((slug: string) => {
    setSelectedTourSlug(slug);
    setSelectionNonce((n) => n + 1);
  }, []);

  const setViewingTourSlug = useCallback((slug: string) => {
    setViewingTourSlugState((prev) => (prev === slug ? prev : slug));
  }, []);

  const setViewingTournamentId = useCallback((id: string | null) => {
    setViewingTournamentIdState((prev) => (prev === id ? prev : id));
  }, []);

  return (
    <TourSelectionContext.Provider
      value={{
        selectedTourSlug,
        selectionNonce,
        selectTour,
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
      selectedTourSlug: null,
      selectionNonce: 0,
      selectTour: () => {},
      viewingTourSlug: null,
      setViewingTourSlug: () => {},
      viewingTournamentId: null,
      setViewingTournamentId: () => {},
    };
  }
  return ctx;
}
