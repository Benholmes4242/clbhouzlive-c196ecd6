/**
 * TourSelectionContext — channels between the tour switcher and the hero.
 *
 * TWO DISTINCT, NON-CIRCULAR FLOWS (this separation is what prevents the old
 * parent<->hero flashing deadlock from returning):
 *
 *  1. COMMAND (switcher → hero):  selectTour(slug, { tournamentId? }) bumps
 *     selectionNonce; the hero's jump effect keys ONLY on selectionNonce and
 *     moves its index. When tournamentId is supplied (multi-event tours), the
 *     hero prefers the exact matching slide over the first slide for the tour.
 *
 *  2. DISPLAY (hero → switcher + downstream):  setViewingTourSlug /
 *     setViewingTournamentId report whichever tour + tournament the hero is
 *     currently showing. The switcher reads viewingTourSlug for its LABEL
 *     and viewingTournamentId for its active-row highlight; Tournament
 *     Intelligence reads viewingTournamentId so its picks always match the
 *     hero. The hero must NEVER read these back into its own index —
 *     display-only, dead end.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SelectTourOptions {
  tournamentId?: string;
}

interface TourSelectionValue {
  selectedTourSlug: string | null;
  selectedTournamentId: string | null;
  selectionNonce: number;
  selectTour: (slug: string, opts?: SelectTourOptions) => void;
  viewingTourSlug: string | null;
  setViewingTourSlug: (slug: string) => void;
  viewingTournamentId: string | null;
  setViewingTournamentId: (id: string | null) => void;
}

const TourSelectionContext = createContext<TourSelectionValue | null>(null);

export function TourSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);
  const [viewingTourSlug, setViewingTourSlugState] = useState<string | null>(null);
  const [viewingTournamentId, setViewingTournamentIdState] = useState<string | null>(null);

  const selectTour = useCallback((slug: string, opts?: SelectTourOptions) => {
    setSelectedTourSlug(slug);
    setSelectedTournamentId(opts?.tournamentId ?? null);
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
        selectedTournamentId,
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
      selectedTournamentId: null,
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
