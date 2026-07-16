/**
 * OverviewPageV3 - Tour Hub Overview
 *
 * NOTE: Hero carousel + tour switchers were nuked. A placeholder sits where the
 * hero was while we rebuild. Editorial modules below are unchanged.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ComingUpSlot } from '../overview-v3/ComingUpSlot';
import { CollegeFranchise } from '../../overview/sections/CollegeFranchise';
import { ConnectHandicapTile } from '../../overview/sections/ConnectHandicapTile';
import { LazySection } from '../overview-v3/LazySection';

import { TISlot } from '../overview-v3/TISlot';
import { WorldRankingsSlot } from '../overview-v3/WorldRankingsSlot';
import { StatWatchSlot } from '../overview-v3/StatWatchSlot';

import { OverviewHero } from '../overview-v3/OverviewHero';
import { OnTheCourseSlot } from '../overview-v3/OnTheCourseSlot';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { SPACE } from '@/lib/spacing';


export function OverviewPageV3() {
  const { isOnline } = useNetworkStatus();
  // READ-ONLY: keyed here purely to drive the OTC + TI synchronized fade so
  // the hero-lensed unit visibly changes together. Must not write back.
  const { viewingTournamentId } = useTourSelection();

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
              You're offline. Some data may be outdated.
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

        {/* Cohesion unit: OTC + TI sit in a tight 14px group directly under
            the hero, keyed to viewingTournamentId so they crossfade together
            in step with the hero. The larger sectionSection gap that follows
            is what makes this unit read as one. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewingTournamentId ?? 'none'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 12 }}
          >
            <OnTheCourseSlot />
            <TISlot />
          </motion.div>
        </AnimatePresence>

        <div
          id="content-below-hero"
          className="relative z-10"
        >
          <div className="bg-background" style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sectionSection, paddingTop: SPACE.sectionSection, paddingBottom: 88 }}>
            <LazySection minHeight={400}>
              <ComingUpSlot />
            </LazySection>
            <LazySection minHeight={400}>
              <WorldRankingsSlot />
            </LazySection>
            <LazySection minHeight={400}>
              <StatWatchSlot />
            </LazySection>
            <LazySection minHeight={350}>
              <CollegeFranchise />
            </LazySection>
            <LazySection minHeight={90}>
              <ConnectHandicapTile />
            </LazySection>
          </div>
        </div>
        <ScrollToTopGlass />
      </motion.div>
    </>
  );
}
