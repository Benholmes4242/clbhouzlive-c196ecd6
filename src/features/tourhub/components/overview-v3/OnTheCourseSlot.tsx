/**
 * OnTheCourseSlot — tournament-scoped live rail. Follows the featured
 * live tournament (viewingTournamentId) unconditionally. No tour lens:
 * this section is per-tournament, not per-tour.
 *
 * Mount/unmount animates height 0 → auto so late arrivals expand smoothly
 * under the hero. initial={false} ensures cached/instant data mounts
 * statically (no needless wiggle on warm loads).
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { OnTheCourse } from '@/features/tourhub/_shared/OnTheCourse';
import { useTournamentPulse } from './useTournamentPulse';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';

export function OnTheCourseSlot() {
  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const tournamentId = viewingTournamentId ?? undefined;
  const { isLive } = useTournamentPulse(tournamentId);

  const show = !!tournamentId && isLive;
  const tourCode = (viewingTourSlug ?? 'pga') as TourId;

  return (
    <AnimatePresence initial={false}>
      {show && tournamentId && (
        <motion.div
          key="otc"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ overflow: 'hidden' }}
        >
          <OnTheCourse tournamentId={tournamentId} live={isLive} tourCode={tourCode} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OnTheCourseSlot;
