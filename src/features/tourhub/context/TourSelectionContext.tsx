/**
 * TourSelectionContext — one-way channel for the manual tour switcher.
 *
 * The tab-row switcher (TourSwitcherAffordance) WRITES a selected tour slug
 * here; OverviewHero READS it and jumps its own internal index to a matching
 * slide. The hero never writes back. This deliberate one-directional flow is
 * what keeps the old parent<->hero deadlock from returning.
 *
 * `selectedTourSlug === null` means "no manual selection yet" — the hero keeps
 * its random landing slide untouched.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface TourSelectionValue {
  selectedTourSlug: string | null;
  /** Monotonic counter so the hero can react even if the same slug is re-picked. */
  selectionNonce: number;
  selectTour: (slug: string) => void;
}

const TourSelectionContext = createContext<TourSelectionValue | null>(null);

export function TourSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);

  const selectTour = useCallback((slug: string) => {
    setSelectedTourSlug(slug);
    setSelectionNonce((n) => n + 1);
  }, []);

  return (
    <TourSelectionContext.Provider value={{ selectedTourSlug, selectionNonce, selectTour }}>
      {children}
    </TourSelectionContext.Provider>
  );
}

/** Safe to call outside the provider — returns inert defaults. */
export function useTourSelection(): TourSelectionValue {
  const ctx = useContext(TourSelectionContext);
  if (!ctx) {
    return { selectedTourSlug: null, selectionNonce: 0, selectTour: () => {} };
  }
  return ctx;
}
