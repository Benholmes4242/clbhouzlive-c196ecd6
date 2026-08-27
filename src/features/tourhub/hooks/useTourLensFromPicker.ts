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
): void {
  const { selectedTourSlug, selectionNonce } = useTourSelection();
  const acceptRef = useRef(accept);
  const applyRef = useRef(apply);
  acceptRef.current = accept;
  applyRef.current = apply;

  useEffect(() => {
    if (!selectedTourSlug) return;
    const next = acceptRef.current(selectedTourSlug);
    if (next === undefined) return;
    applyRef.current(next);
  }, [selectedTourSlug, selectionNonce]);
}
