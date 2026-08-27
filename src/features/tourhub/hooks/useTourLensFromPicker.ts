/**
 * useTourLensFromPicker — bridges the ChromeIsland tour picker into a tour
 * sub-page's local lens state.
 *
 * BRIEF_TOUR_HEADER_ONE_ROW deleted the sticky pills row from the sub-pages,
 * so the island's TourPickerSheet is now the only tour control there. The
 * sheet writes to TourSelectionContext (slug + selectionNonce); this hook
 * replays each selection onto the page's existing local state, so the data
 * path is unchanged — only the control moved.
 *
 * The sheet can emit slugs a page cannot express ('all' where the page has no
 * merged view, 'major', or 'champ' on boards with no coverage). `accept`
 * translates a slug to the page's own value, or returns undefined to ignore
 * the selection outright — never to silently substitute a different tour.
 */
import { useEffect, useRef } from 'react';
import { useTourSelection } from '../context/TourSelectionContext';

export function useTourLensFromPicker<T>(
  accept: (slug: string) => T | undefined,
  apply: (value: T) => void,
  /**
   * The slug the page is ACTUALLY showing right now (BRIEF_TOUR_LABEL_FOLLOWS_
   * THE_LIST). Published upward so the island label is a readout of the list,
   * whichever route put the page on that tour (picker, ?tour= deep link, or a
   * fresh mount default). The page publishes; it must never subscribe back.
   */
  appliedSlug?: string | null,
): void {
  const {
    selectedTourSlug,
    selectionNonce,
    registerAcceptedSlugs,
    setAppliedTourSlug,
  } = useTourSelection();
  const acceptRef = useRef(accept);
  const applyRef = useRef(apply);
  acceptRef.current = accept;
  applyRef.current = apply;

  // S2.1 — register what this page can express so the picker can disable the
  // rest and selectTour can refuse to commit one. The `accept`-returns-
  // undefined path below is now a BACKSTOP for a page that forgets to register.
  useEffect(
    () => registerAcceptedSlugs((slug) => acceptRef.current(slug) !== undefined),
    [registerAcceptedSlugs],
  );

  // Publish on mount and on every change; CLEAR on unmount — a stale applied
  // slug outliving its page is the same disagreement in a new place.
  useEffect(() => {
    if (appliedSlug === undefined) return;
    setAppliedTourSlug(appliedSlug);
  }, [appliedSlug, setAppliedTourSlug]);

  useEffect(() => {
    if (appliedSlug === undefined) return;
    return () => setAppliedTourSlug(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAppliedTourSlug]);

  /* Replay picker COMMANDS only. selectionNonce is 0 until something actually
     commands a tour, so a fresh mount no longer overwrites the page's own
     ?tour= seed with the stored/default slug — which was the second half of
     the label/list disagreement (the list was PGA while the link said LIV). */
  useEffect(() => {
    if (selectionNonce === 0) return;
    if (!selectedTourSlug) return;
    const next = acceptRef.current(selectedTourSlug);
    if (next === undefined) return;
    applyRef.current(next);
  }, [selectedTourSlug, selectionNonce]);
}
