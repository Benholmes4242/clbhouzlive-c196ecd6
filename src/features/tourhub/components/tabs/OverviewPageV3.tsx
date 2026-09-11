/**
 * OverviewPageV3 - Tour Hub Overview
 *
 * Hero: the self-contained Hero River carousel (OverviewHero). Editorial modules follow in lazy sections.
 */

import { useEffect } from 'react';
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
import { WireOverviewSection } from '../../news/WireOverviewSection';

import { OverviewHero } from '../overview-v3/OverviewHero';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { SPACE } from '@/lib/spacing';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { OVERVIEW_GUTTER } from '../../overview/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';



export function OverviewPageV3() {
  const { t } = useTranslation('tourhub');
  const { isOnline } = useNetworkStatus();
  // READ-ONLY: keyed here purely to drive the OTC + Schedule synchronized fade so
  // the hero-lensed unit visibly changes together. Must not write back.
  const { viewingTournamentId, viewingIsLive, selectedTourSlug, setAppliedTourSlug } = useTourSelection();

  // The overview's island label describes the lens used by its sections, not
  // the tour of whichever tournament happens to be visible in the hero.
  useEffect(() => {
    setAppliedTourSlug(selectedTourSlug ?? 'all');
    return () => setAppliedTourSlug(null);
  }, [selectedTourSlug, setAppliedTourSlug]);


  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 bg-muted/95 backdrop-blur-sm border-b border-border/10"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
          >
            <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {t('overview.page.offlineBanner')}
            </span>

          </motion.div>
        )}
      </AnimatePresence>

      {/*
        ONE CANVAS (device-walk-2 A). The hero bands and the board band paint
        A.CANVAS === PAGE_CANVAS (#15171F, the Explore page's canvas). This page
        used the Tailwind `bg-background` utility, whose HSL resolves to
        rgb(23,24,28) — two levels off, which is exactly the range that reads as
        "two surfaces stitched together" rather than as a deliberate step. The
        canvas is now the same token the board uses; no new hex, Explore
        untouched. The CSS var's own `#15171F` comment is inaccurate and is a
        separate item — do not "fix" this by trusting it.
      */}
      <motion.div
        className="min-h-screen"
        style={{ marginTop: 0, paddingTop: 0, background: PAGE_CANVAS }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Tour Hub Hero River — self-contained carousel crossing all tours.
            See OverviewHero.tsx. */}
        <OverviewHero />

        {/* SECTION TWO — THE VENUE ON CLBHOUZ (structural brief D). Out of the
            hero cohesion unit entirely and standing as its own full section
            directly beneath the hero: on a live tournament that is directly
            beneath the board band, the hero's last band. Still keyed to
            viewingTournamentId so it changes in step with the hero, and it
            self-hides when the tournament has no linked course. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`venue-${viewingTournamentId ?? 'none'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            /* On a live slide the dark hero block ends with a straight edge
               directly above this — the canvas must BREATHE, so the gap is
               real (24), not the old 2px seam. */
            style={{ paddingTop: viewingIsLive ? 24 : 12 }}
          >
            <VenueRecordBand tournamentId={viewingTournamentId ?? undefined} />
          </motion.div>
        </AnimatePresence>

        {/* The Schedule keeps its own keyed crossfade beneath the venue. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewingTournamentId ?? 'none'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: SPACE.sectionSection }}
          >
            <ComingUpSlot />
          </motion.div>

        </AnimatePresence>


        <div
          id="content-below-hero"
          className="relative z-10"
        >
          <div style={{ background: PAGE_CANVAS, display: 'flex', flexDirection: 'column', gap: SPACE.sectionSection, paddingTop: SPACE.sectionSection, paddingBottom: NAV_CLEARANCE }}>
            <WireOverviewSection />
            <LazySection minHeight={400}>
              <WorldRankingsSlot />
            </LazySection>
            <LazySection minHeight={400}>
              <StatWatchSlot />
            </LazySection>
            <CourseOfTheWeekSection />
            <LazySection minHeight={90}>
              {/* flat: this page draws no bordered cards (structural brief A). */}
              <ConnectHandicapCue variant="tour-venue" courseName="" flat />
            </LazySection>
            <LazySection minHeight={350}>
              <CollegeFranchise />
            </LazySection>

            {/* THE PAGE ENDS AT ALL FRANCHISES (device-walk-2 F). The
                provenance line ("Leaderboards and rankings from the tours.
                Ratings from clbhouz members.") and the hairline above it are
                gone by ruling, and its locale key is retired in all six files
                rather than left rendering an empty line. The foot now reserves
                only the measured bottom-control clearance (NAV_CLEARANCE) —
                the old `var(--bottom-nav-height, 96px)` left close to a
                screenful of nothing, which reads as content that failed to
                load. */}
          </div>
        </div>
        <ScrollToTopGlass />
      </motion.div>
    </>
  );
}
