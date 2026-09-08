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

import { useEffect } from 'react';

import { FIGS } from '@/components/explore-tab-new/courseled/tokens';
import { TourHero } from '@/features/tour/TourHero';
import { TourHeader } from '@/features/tour/TourHeader';
import { FONT } from '@/features/tourhub/_shared/tokens';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { analyticsEvents } from '@/utils/analyticsEvents';

const CANVAS = '#0D0F14';

export default function TourPage() {
  useEffect(() => {
    analyticsEvents.track('tour_page_viewed', {});
  }, []);

  return (
    <div style={{ background: CANVAS, minHeight: '100dvh', fontFamily: FONT, ...FIGS }}>
      <TourHeader />
      <TourHero />

      <main style={{ padding: `14px 14px ${NAV_CLEARANCE}` }}>
        {/* Blocks 1-4 land here, in order: leaderboard, Our Picks, Coming Up, wire. */}
      </main>
    </div>
  );
}
