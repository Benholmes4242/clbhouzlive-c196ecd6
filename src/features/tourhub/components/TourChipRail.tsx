/**
 * TourChipRail — the tour lens, as a FILTER where filters live.
 *
 * BRIEF_TOUR_HEADER_CORRECTION, Correction 1. "ALL TOURS" used to be a text
 * dropdown inside the control row, which put a filter in the chrome. Discover
 * puts filters on the canvas below the header, so this rail does too: the
 * canonical board chip (`RailChips` — 12/700, 6x11, selected A.INK ground with
 * A.CANVAS text), no panel fill, no borders around the row, scrolling with the
 * content rather than sticking.
 *
 * It is ABSENT on the live leaderboard, which is deliberately cross-tour: a
 * single selected tour chip there would state something false.
 */
import { RailChips } from '@/components/ui/RailChips';
import { useTourSelection } from '../context/TourSelectionContext';

// i18n never-key: tour brand names are proper nouns (see TourPickerSheet).
const OPTIONS = [
  { id: 'all', label: 'ALL TOURS' },
  { id: 'major', label: 'MAJORS' },
  { id: 'pga', label: 'PGA' },
  { id: 'lpga', label: 'LPGA' },
  { id: 'euro', label: 'DP WORLD' },
  { id: 'pgad', label: 'KORN FERRY' },
  { id: 'champ', label: 'CHAMPIONS' },
  { id: 'liv', label: 'LIV' },
] as const;

export function TourChipRail() {
  const { selectedTourSlug, viewingTourSlug, appliedTourSlug, selectTour, isSlugAcceptable } =
    useTourSelection();
  const active = appliedTourSlug ?? selectedTourSlug ?? viewingTourSlug ?? 'all';

  /* The active tab registers what it can express; a chip it cannot honour is
     not offered rather than offered and silently refused. */
  const options = OPTIONS.filter((o) => (isSlugAcceptable ? isSlugAcceptable(o.id) : true));

  return (
    <RailChips
      options={options.length > 0 ? options : OPTIONS}
      value={active}
      onChange={(id) => selectTour(id)}
      ariaLabel="Filter by tour"
      style={{ padding: '10px 12px 2px' }}
    />
  );
}

export default TourChipRail;
