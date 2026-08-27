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
 *  2. DISPLAY (hero -> picker + OTC/TI):  setViewingTourSlug /
 *     setViewingTournamentId report whichever tour + tournament the hero is
 *     currently showing. Display-only; the hero must never read these back.
 *
 * LAND-TIME LIVE-FIRST OVERRIDE:
 *  The initial tour comes from localStorage (default 'pga'). After live
 *  carousel data resolves, the hero calls applyLandingSelection(liveSlugs)
 *  once. If the stored tour has no live tournament but another tour does,
 *  we switch to the highest-priority live tour — WITHOUT overwriting
 *  storage. Manual selectTour calls set userInteracted=true and skip any
 *  further landing overrides for the rest of the session.
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
  resolveLandingTour,
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
  /** Register the active page's expressable-slug predicate; returns a cleanup. */
  registerAcceptedSlugs: (predicate: SlugPredicate) => () => void;
  /** True when no page has registered (overview) or the page accepts the slug. */
  isSlugAcceptable: (slug: string) => boolean;
}


const TourSelectionContext = createContext<TourSelectionValue | null>(null);

export function TourSelectionProvider({ children }: { children: ReactNode }) {
  // Initial tour comes from localStorage — falls back to PGA.
  const [selectedTourSlug, setSelectedTourSlug] = useState<string | null>(
    () => readStoredTour() ?? 'pga',
  );
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);
  const [viewingTourSlug, setViewingTourSlugState] = useState<string | null>(null);
  const [viewingTournamentId, setViewingTournamentIdState] = useState<string | null>(null);
  const [viewingIsLive, setViewingIsLiveState] = useState<boolean>(false);


  // Guards for the land-time override — runs at most once per session, and
  // never after the user has manually switched tours.
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
    const stored = readStoredTour() ?? selectedTourSlug ?? 'pga';
    const next = resolveLandingTour(stored, liveSlugs);
    if (!next || next === selectedTourSlug) return;
    // Do NOT persist — storage still reflects the user's preference. Bump the
    // nonce so the hero jumps to a slide on the new tour.
    setSelectedTourSlug(next);
    setSelectedTournamentId(null);
    setSelectionNonce((n) => n + 1);
  }, [selectedTourSlug]);

  const setViewingTourSlug = useCallback((slug: string) => {
    setViewingTourSlugState((prev) => (prev === slug ? prev : slug));
  }, []);

  const setViewingTournamentId = useCallback((id: string | null) => {
    setViewingTournamentIdState((prev) => (prev === id ? prev : id));
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
      registerAcceptedSlugs: () => () => {},
      isSlugAcceptable: () => true,
    };
  }
  return ctx;
}
