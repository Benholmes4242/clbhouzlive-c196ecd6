/**
 * TourSelectionContext — channels between the tour switcher and the hero.
 *
 * TWO DISTINCT, NON-CIRCULAR FLOWS (this separation is what prevents the old
 * parent<->hero flashing deadlock from returning):
 *
 *  1. COMMAND (switcher → hero):  selectTour(slug) bumps selectionNonce; the
 *     hero's jump effect keys ONLY on selectionNonce and moves its index.
 *
 *  2. DISPLAY (hero → switcher):  setViewingTourSlug(slug) reports whichever
 *     tour the hero is currently showing (random landing, swipe, dots, or a
 *     tap-jump). The switcher reads viewingTourSlug for its LABEL/highlight
 *     ONLY. The hero must NEVER read viewingTourSlug back into its index — that
 *     would close the loop. It is display-only, a dead end.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface TourSelectionValue {
  selectedTourSlug: string | null;
  selectionNonce: number;
  selectTour: (slug: string) => void;
  viewingTourSlug: string | null;
  setViewingTourSlug: (slug: string) => void;
}

const TourSelectionContext = createContext<TourSelectionValue | null>(null);

export function TourSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);
  const [viewingTourSlug, setViewingTourSlugState] = useState<string | null>(null);

  const selectTour = useCallback((slug: string) => {
    setSelectedTourSlug(slug);
    setSelectionNonce((n) => n + 1);
  }, []);

  const setViewingTourSlug = useCallback((slug: string) => {
    setViewingTourSlugState((prev) => (prev === slug ? prev : slug));
  }, []);

  return (
    <TourSelectionContext.Provider
      value={{ selectedTourSlug, selectionNonce, selectTour, viewingTourSlug, setViewingTourSlug }}
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
    };
  }
  return ctx;
}
