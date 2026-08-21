/**
 * OverviewPageV3 - Tour Hub Overview
 *
 * Hero: the self-contained Hero River carousel (OverviewHero). Editorial modules follow in lazy sections.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ComingUpSlot } from '../overview-v3/ComingUpSlot';
import { CollegeFranchise } from '../../overview/sections/CollegeFranchise';
import { VenueRecordBand } from '../../overview/sections/VenueRecordBand';
import { CourseOfTheWeekSection } from '../../overview/sections/CourseOfTheWeekSection';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';
import { LazySection } from '../overview-v3/LazySection';

import { WorldRankingsSlot } from '../overview-v3/WorldRankingsSlot';
import { StatWatchSlot } from '../overview-v3/StatWatchSlot';

import { OverviewHero } from '../overview-v3/OverviewHero';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { SPACE } from '@/lib/spacing';



export function OverviewPageV3() {
  const { t } = useTranslation('tourhub');
  const { isOnline } = useNetworkStatus();
  // READ-ONLY: keyed here purely to drive the OTC + Schedule synchronized fade so
  // the hero-lensed unit visibly changes together. Must not write back.
  const { viewingTournamentId, viewingIsLive } = useTourSelection();


  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 bg-muted/95 backdrop-blur-sm border-b border-border"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
          >
            <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {t('overview.page.offlineBanner')}
            </span>

          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="min-h-screen bg-background"
        style={{ marginTop: 0, paddingTop: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Tour Hub Hero River — self-contained carousel crossing all tours.
            See OverviewHero.tsx. */}
        <OverviewHero />

        {/* Cohesion unit: VenueRecordBand + Schedule sit in a tight 14px
            group directly under the hero, keyed to viewingTournamentId so they
            crossfade together in step with the hero. The larger sectionSection
            gap that follows is what makes this unit read as one. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewingTournamentId ?? 'none'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            /* On a live slide the dark hero block ends with a straight edge
               directly above this — the canvas must BREATHE before the Schedule,
               so the gap is real (24), not the old 2px seam. */
            style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: viewingIsLive ? 24 : 12 }}
          >
            <VenueRecordBand tournamentId={viewingTournamentId ?? undefined} />
            <ComingUpSlot />
          </motion.div>

        </AnimatePresence>

        <div
          id="content-below-hero"
          className="relative z-10"
        >
          <div className="bg-background" style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sectionSection, paddingTop: SPACE.sectionSection, paddingBottom: 88 }}>
            <LazySection minHeight={400}>
              <WorldRankingsSlot />
            </LazySection>
            <LazySection minHeight={400}>
              <StatWatchSlot />
            </LazySection>
            <CourseOfTheWeekSection />
            <LazySection minHeight={350}>
              <CollegeFranchise />
            </LazySection>
            <LazySection minHeight={90}>
              <ConnectHandicapCue variant="tour-venue" courseName="" />
            </LazySection>
          </div>
        </div>
        <ScrollToTopGlass />
      </motion.div>
    </>
  );
}
