/**
 * ComingUpSlot — mounts the v4 ComingUp section on the live Overview.
 *
 * Driven by the GLOBAL tour chip (TourSelectionContext), not a per-section
 * lens: one control on the page. The synthetic 'major' pseudo-tour and the
 * "All tours" selection both resolve to null, which makes ComingUp render a
 * single chronological merged list across every tour (soonest first).
 */
import { ComingUp } from '@/features/tourhub/overview/sections/ComingUp';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

const SCHEDULE_TOURS = new Set<string>(['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv']);

export function ComingUpSlot() {
  const { selectedTourSlug, viewingTournamentId } = useTourSelection();
  const active = selectedTourSlug ?? 'all';
  const tour = SCHEDULE_TOURS.has(active) ? (active as TourId) : null;
  // The tournament in the hero is excluded from the list below it — one fact,
  // one place. Same id the venue/schedule cohesion block is keyed by.
  return <ComingUp tour={tour} excludeId={viewingTournamentId ?? null} />;
}

export default ComingUpSlot;
