/**
 * OverviewPageV3 - Tour Hub Overview
 *
 * Hero: the self-contained Hero River carousel. Five independently absent overview sections follow.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ComingUpSlot } from '../overview-v3/ComingUpSlot';
import { VenueRecordBand } from '../../overview/sections/VenueRecordBand';
import { AlsoThisWeek } from '../../overview/sections/AlsoThisWeek';
import { WorldRankings } from '../../overview/sections/WorldRankings';
import { OverviewNews } from '../../overview/sections/OverviewNews';

import { OverviewHero } from '../overview-v3/OverviewHero';
import { useHeroCarouselData } from '../../hooks/useHeroCarouselData';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';



export function OverviewPageV3() {
  const { t } = useTranslation('tourhub');
  const { isOnline } = useNetworkStatus();
  const { selectedTourSlug, viewingTournamentId, setAppliedTourSlug } = useTourSelection();
  const { data: heroSlides = [] } = useHeroCarouselData();
  const viewingVenueName = heroSlides.find((slide) => slide.tournament.id === viewingTournamentId)?.tournament.venueName ?? null;

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

        <div
          id="content-below-hero"
          className="relative z-10"
        >
          <div style={{ background: PAGE_CANVAS }}>
            <VenueRecordBand tournamentId={viewingTournamentId ?? undefined} venueName={viewingVenueName} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: 32 }}>
              <AlsoThisWeek />
              <ComingUpSlot />
              <WorldRankings />
              <OverviewNews />

              {/* The shared page shell reserves the measured bottom-nav clearance. */}
            </div>
          </div>
        </div>
        <ScrollToTopGlass />
      </motion.div>
    </>
  );
}
