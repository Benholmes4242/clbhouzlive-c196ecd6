/**
 * OverviewPageV3 - Tour Hub Overview
 *
 * NOTE: Hero carousel + tour switchers were nuked. A placeholder sits where the
 * hero was while we rebuild. Editorial modules below are unchanged.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ComingUpCalendar } from '../ComingUpCalendar';
import { CollegeRivalry } from '../CollegeRivalry';
import { LazySection } from '../overview-v3/LazySection';

import { IntelligenceHero } from '../IntelligenceHero';
import { WorldRankingsHero } from '../WorldRankingsHero';
import { StatOfTheWeek } from '../StatOfTheWeek';
import { HomeCourseOfWeekModule } from '../home/HomeCourseOfWeekModule';

import { HomeConnectHandicapModule } from '../home/HomeConnectHandicapModule';

import { OverviewHero } from '../overview-v3/OverviewHero';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';


export function OverviewPageV3() {
  const { isOnline } = useNetworkStatus();

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
        {/* Tour Hub hero — self-contained carousel (single-owner index, random
            landing slide, all three states eligible). See OverviewHero.tsx. */}
        <OverviewHero />



        <div
          id="content-below-hero"
          className="relative z-10"
        >
          <div className="bg-background" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
            <LazySection minHeight={160}>
              <HomeConnectHandicapModule />
            </LazySection>
            <LazySection minHeight={500}>
              <div style={{ marginTop: 16 }}>
                <IntelligenceHero />
              </div>
            </LazySection>
            <LazySection minHeight={400}>
              <ComingUpCalendar />
            </LazySection>
            <LazySection minHeight={260}>
              <HomeCourseOfWeekModule />
            </LazySection>
            <LazySection minHeight={400}>
              <WorldRankingsHero />
            </LazySection>
            <LazySection minHeight={400}>
              <StatOfTheWeek />
            </LazySection>
            <LazySection minHeight={350}>
              <CollegeRivalry />
            </LazySection>
          </div>
        </div>
        <ScrollToTopGlass />
      </motion.div>
    </>
  );
}
