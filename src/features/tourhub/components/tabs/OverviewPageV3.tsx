/**
 * OverviewPageV3 - Editorial Golf Intelligence Destination
 * 
 * MODULE ORDER:
 * 1. PrimaryHero (single-winner, full-bleed)
 * 2. LiveRightNow (horizontal awareness strip)
 * 3. TourIntelligenceSnapshot ("What Wins Right Now")
 * 4. MomentumIndex (Surging / Stable / Sliding)
 * 5. TourTitles (gamified category leaders)
 * 6. CollegeRivalries (compact college rankings)
 * 7. WhatsComing (awareness schedule)
 * 8. DeepLinksStrip (navigation strip)
 * 
 * Hero preloads immediately. Modules 2-8 lazy-load after hero paint.
 */

import { useState, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { PrimaryHero } from '../overview-v3/PrimaryHero';
import { LiveRightNow } from '../overview-v3/LiveRightNow';
import { TourIntelligenceSnapshot } from '../overview-v3/TourIntelligenceSnapshot';
import { MomentumIndex } from '../overview-v3/MomentumIndex';
import { TourTitles } from '../overview-v3/TourTitles';
import { CollegeRivalries } from '../overview-v3/CollegeRivalries';
import { WhatsComing } from '../overview-v3/WhatsComing';
import { DeepLinksStrip } from '../overview-v3/DeepLinksStrip';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { usePreventOverscroll } from '@/hooks/usePreventOverscroll';
import { HERO_STYLES } from '../../constants/heroStyles';

export function OverviewPageV3() {
  const { setDimmablePage, setIsLightDimmed } = useCinemaDimContext();
  const [heroReady, setHeroReady] = useState(false);

  usePreventOverscroll();
  useMedianStatusBar("dark", "transparent", true, false);

  useLayoutEffect(() => {
    setDimmablePage('tourhub-overview');
    setIsLightDimmed(true);
    // Mark hero as ready after a brief paint delay
    const raf = requestAnimationFrame(() => setHeroReady(true));
    return () => {
      cancelAnimationFrame(raf);
      setDimmablePage(null);
      setIsLightDimmed(false);
    };
  }, [setDimmablePage, setIsLightDimmed]);

  return (
    <div
      className="relative min-h-screen"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      {/* 1. Primary Hero — full-bleed, preloaded */}
      <div
        className="relative w-full z-0"
        style={HERO_STYLES.containerNoHeader}
      >
        <PrimaryHero />
      </div>

      {/* Content sections — lazy-loaded after hero paint */}
      {heroReady && (
        <div id="content-below-hero" className="relative z-10">
          <div
            style={{
              backgroundColor: '#F8FAFC',
              paddingBottom: 'calc(var(--sab, 30px) + 16px)',
            }}
          >
            {/* 2. Live Right Now */}
            <LiveRightNow />

            {/* 3. Tour Intelligence Snapshot */}
            <TourIntelligenceSnapshot />

            {/* 4. Momentum Index */}
            <MomentumIndex />

            {/* 5. Tour Titles */}
            <TourTitles />

            {/* 6. College Rivalries */}
            <CollegeRivalries />

            {/* 7. What's Coming */}
            <WhatsComing />

            {/* 8. Deep Links */}
            <DeepLinksStrip />
          </div>
        </div>
      )}
    </div>
  );
}
