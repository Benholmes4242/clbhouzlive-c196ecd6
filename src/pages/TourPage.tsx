/**
 * THE TOUR PAGE (BRIEF_TOUR_REBUILD).
 *
 * One page, one scroll, on the Amateur skeleton: fixed header, 340px full-bleed
 * three-state hero, then blocks. Six tabs collapse into four blocks — the
 * ranked leaderboard, Our Picks, Coming Up and the Tour wire — landing one at a
 * time beneath the hero.
 *
 * THE HEADER OWNS THE SAFE AREA. The page pays nothing at the top: the hero
 * bleeds under the bar deliberately. At the foot it pays NAV_CLEARANCE, never a
 * flat number, so it moves with the nav pill.
 *
 * NOTHING RETIRES YET: /tourhub and its tabs stay standing, with
 * `tourhub_tab_viewed` / `tourhub_tab_changed` still reporting, until this page
 * is complete and confirmed on device.
 */

import { useEffect, useState } from 'react';

import { FIGS } from '@/components/explore-tab-new/courseled/tokens';
import { TourFilterControl } from '@/features/tour/TourFilterControl';
import { TourHero } from '@/features/tour/TourHero';
import { TourLeaderboardBlock } from '@/features/tour/TourLeaderboardBlock';
import { TourPicksBlock } from '@/features/tour/TourPicksBlock';
import { TourComingUpBlock } from '@/features/tour/TourComingUpBlock';
import { TourNewsBlock } from '@/features/tour/TourNewsBlock';
import { useTourBoardState } from '@/features/tour/useTourBoardState';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';
import { FONT } from '@/features/tourhub/_shared/tokens';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { analyticsEvents } from '@/utils/analyticsEvents';

const CANVAS = '#15171F';

export default function TourPage() {
  const [tour, setTour] = useState<TourId | null>(null);
  const effectiveTour = tour ?? 'pga';
  const board = useTourBoardState(tour, setTour);

  useEffect(() => {
    analyticsEvents.track('tour_page_viewed', {});
  }, []);

  return (
    <div style={{ background: CANVAS, minHeight: '100dvh', fontFamily: FONT, ...FIGS }}>
      <TourHero />

      <main style={{ padding: `0 20px ${NAV_CLEARANCE}` }}>
        {/* The picker governs the live leaderboard and Our Picks. Named season
            races remain fixed to their own tours; Colleges remains its own board. */}
        <TourFilterControl
          value={tour}
          onChange={(next) => {
            analyticsEvents.track('tour_picker_changed', { tour: next ?? 'all' });
            setTour(next);
          }}
        />

        <TourLeaderboardBlock state={board} />
        <TourPicksBlock tour={effectiveTour} />
        {/* COMING UP HAS NO TOUR DIMENSION, so the picker does not govern it: a
            member reading one tour still wants next week's whole calendar. */}
        <TourComingUpBlock />
        {/* NEITHER DOES THE WIRE, for the same reason. */}
        <TourNewsBlock />
      </main>
    </div>
  );
}
