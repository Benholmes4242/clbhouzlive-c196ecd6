/**
 * TourSelectionContext — channels between the (scoped) tour picker and the hero.
 *
 * Restored in Phase 5C after Phase 5A removed the command surface. Scope is
 * now local: only the OverviewHero (+ downstream OnTheCourseSlot / TISlot)
 * read from these fields. Every other section moved to its own local lens
 * in Phase 3-4.
 *
 * TWO DISTINCT, NON-CIRCULAR FLOWS:
 *
 *  1. COMMAND (picker -> hero):  selectTour(slug, { tournamentId? }) bumps
 *     selectionNonce; the hero's jump effect keys on selectionNonce and
 *     filters/jumps its slides.
 *
 *  2. DISPLAY (hero -> picker + OTC/TI):  setViewingTourSlug /
 *     setViewingTournamentId report whichever tour + tournament the hero is
 *     currently showing. The picker reads viewingTourSlug for its LABEL and
 *     viewingTournamentId for its active-row highlight; OTC + TI read
 *     viewingTournamentId so they stay locked to the hero. The hero must
 *     NEVER read these back into its own index — display-only, dead end.
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
  // No "All Tours" state in the restored picker: a tour is always selected.
  // Default to PGA so the hero opens on PGA on first mount.
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>('pga');
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
