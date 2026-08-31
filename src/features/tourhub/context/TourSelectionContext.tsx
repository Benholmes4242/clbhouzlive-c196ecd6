/**
 * TourSelectionContext — channels between the (scoped) tour picker and the hero.
 *
 * Scope is local: only the OverviewHero (+ downstream TISlot)
 * read from these fields. Every other section moved to its own local lens
 * in Phase 3-4.
 *
 * TWO DISTINCT, NON-CIRCULAR FLOWS:
 *
 *  1. COMMAND (picker -> hero):  selectTour(slug, { tournamentId? }) bumps
 *     selectionNonce; the hero's jump effect keys on selectionNonce and
 *     filters/jumps its slides.
 *
 *  2. DISPLAY (hero -> tournament-specific readouts): setViewingTourSlug /
 *     setViewingTournamentId report whichever tour + tournament the hero is
 *     currently showing. Display-only; the hero must never read these back.
 *
 * The initial lens comes from localStorage and defaults to 'all'. The hero may
 * display any relevant event inside that lens, but never changes the lens.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  readStoredTour,
  writeStoredTour,
} from '@/features/tourhub/hooks/useTourSelection';

interface SelectTourOptions {
  tournamentId?: string;
}

/**
 * The active tab registers what it can express (S2.1). The picker disables
 * rows outside the set, and selectTour refuses to commit one, so the island
 * label can never state a tour the page is not showing.
 */
export type SlugPredicate = (slug: string) => boolean;

interface TourSelectionValue {
  selectedTourSlug: string | null;
  selectedTournamentId: string | null;
  selectionNonce: number;
  selectTour: (slug: string, opts?: SelectTourOptions) => void;
  /**
   * Land-time only: once live tour slugs are known, evaluate whether to
   * override the stored/default tour with the highest-priority live tour.
   * No-op after the first call OR after any manual selectTour.
   */
  applyLandingSelection: (liveSlugs: readonly string[]) => void;
  viewingTourSlug: string | null;
  setViewingTourSlug: (slug: string) => void;
  viewingTournamentId: string | null;
  setViewingTournamentId: (id: string | null) => void;
  /** Whether the hero's currently-viewed slide is a LIVE tournament. Display-only. */
  viewingIsLive: boolean;
  setViewingIsLive: (isLive: boolean) => void;
  /**
   * The tour the surface currently on screen is ACTUALLY showing (published by
   * the active tab via useTourLensFromPicker). Null when no page publishes —
   * the overview, which is driven BY selectedTourSlug and has nothing separate
   * to report. Label hooks read this FIRST so the capsule reports the list.
   */
  appliedTourSlug: string | null;
  setAppliedTourSlug: (slug: string | null) => void;
  /** Register the active page's expressable-slug predicate; returns a cleanup. */
  registerAcceptedSlugs: (predicate: SlugPredicate) => () => void;
  /** True when no page has registered (overview) or the page accepts the slug. */
  isSlugAcceptable: (slug: string) => boolean;
}


const TourSelectionContext = createContext<TourSelectionValue | null>(null);

export function TourSelectionProvider({ children }: { children: ReactNode }) {
  // A member's stored choice wins; otherwise the hub starts unfiltered.
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>(
    () => readStoredTour() ?? 'all',
  );
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);
  const [viewingTourSlug, setViewingTourSlugState] = useState<string | null>(null);
  const [viewingTournamentId, setViewingTournamentIdState] = useState<string | null>(null);
  const [viewingIsLive, setViewingIsLiveState] = useState<boolean>(false);
  const [appliedTourSlug, setAppliedTourSlugState] = useState<string | null>(null);


  // Retained for API compatibility with older consumers. Landing no longer
  // changes the selected lens; the hero is a readout, not a control.
  const userInteractedRef = useRef(false);
  const landingAppliedRef = useRef(false);

  // The active tab's expressable-slug predicate (S2.1). Null means nothing has
  // registered — the overview expresses every slug, so everything is allowed.
  const acceptRef = useRef<SlugPredicate | null>(null);
  const [, setAcceptNonce] = useState(0);

  const registerAcceptedSlugs = useCallback((predicate: SlugPredicate) => {
    acceptRef.current = predicate;
    setAcceptNonce((n) => n + 1);
    return () => {
      if (acceptRef.current === predicate) {
        acceptRef.current = null;
        setAcceptNonce((n) => n + 1);
      }
    };
  }, []);

  const isSlugAcceptable = useCallback((slug: string) => {
    const fn = acceptRef.current;
    return fn ? fn(slug) : true;
  }, []);

  const selectTour = useCallback((slug: string, opts?: SelectTourOptions) => {
    // S2.3 — never commit a slug the active page cannot express; the label is
    // derived from selectedTourSlug, so committing one would make it lie.
    // This guard and appliedTourSlug are the two halves of ONE rule: this stops
    // the label LEADING the list, appliedTourSlug stops it LAGGING. Neither
    // replaces the other.
    if (acceptRef.current && !acceptRef.current(slug)) return;
    userInteractedRef.current = true;
    landingAppliedRef.current = true;
    writeStoredTour(slug);
    setSelectedTourSlug(slug);
    setSelectedTournamentId(opts?.tournamentId ?? null);
    setSelectionNonce((n) => n + 1);
  }, []);

  const applyLandingSelection = useCallback((liveSlugs: readonly string[]) => {
    if (landingAppliedRef.current || userInteractedRef.current) return;
    landingAppliedRef.current = true;
    void liveSlugs;
  }, []);

  const setViewingTourSlug = useCallback((slug: string) => {
    setViewingTourSlugState((prev) => (prev === slug ? prev : slug));
  }, []);

  const setViewingTournamentId = useCallback((id: string | null) => {
    setViewingTournamentIdState((prev) => (prev === id ? prev : id));
  }, []);

  const setAppliedTourSlug = useCallback((slug: string | null) => {
    setAppliedTourSlugState((prev) => (prev === slug ? prev : slug));
  }, []);

  const setViewingIsLive = useCallback((isLive: boolean) => {
    setViewingIsLiveState((prev) => (prev === isLive ? prev : isLive));
  }, []);


  return (
    <TourSelectionContext.Provider
      value={{
        selectedTourSlug,
        selectedTournamentId,
        selectionNonce,
        selectTour,
        applyLandingSelection,
        viewingTourSlug,
        setViewingTourSlug,
        viewingTournamentId,
        setViewingTournamentId,
        viewingIsLive,
        setViewingIsLive,
        appliedTourSlug,
        setAppliedTourSlug,
        registerAcceptedSlugs,
        isSlugAcceptable,
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
      applyLandingSelection: () => {},
      viewingTourSlug: null,
      setViewingTourSlug: () => {},
      viewingTournamentId: null,
      setViewingTournamentId: () => {},
      viewingIsLive: false,
      setViewingIsLive: () => {},
      appliedTourSlug: null,
      setAppliedTourSlug: () => {},
      registerAcceptedSlugs: () => () => {},
      isSlugAcceptable: () => true,
    };
  }
  return ctx;
}
