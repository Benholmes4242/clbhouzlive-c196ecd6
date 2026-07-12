/**
 * ComingUpSlot - adapter that mounts the v4 ComingUp section on the live
 * Overview, keyed to viewingTourSlug (matches hero + On-the-Course rail + TI).
 *
 * TourId compat: viewingTourSlug is typed `string | null` in the context but
 * its runtime values are produced by mapTourSlug() and always land inside
 * TOUR_CONFIG (pga | euro | lpga | liv | pgad | champ). Fall back to 'pga'
 * when unset and narrow via cast at the boundary.
 *
 * Empty-state: v4 ComingUp already returns null when its data array is empty,
 * so this slot renders unconditionally without leaving a stub card.
 */
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { ComingUp } from '@/features/tourhub/overview-v4/sections/ComingUp';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function ComingUpSlot() {
  const { viewingTourSlug } = useTourSelection();
  const tour = (viewingTourSlug ?? 'pga') as TourId;
  return <ComingUp tour={tour} />;
}

export default ComingUpSlot;
