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
import { RailChips } from '@/components/ui/RailChips';
import { TourHero } from '@/features/tour/TourHero';
import { TourHeader } from '@/features/tour/TourHeader';
import { TourLeaderboardBlock } from '@/features/tour/TourLeaderboardBlock';
import { TourPicksBlock } from '@/features/tour/TourPicksBlock';
import { TourComingUpBlock } from '@/features/tour/TourComingUpBlock';
import { useTourBoardState } from '@/features/tour/useTourBoardState';
import { TOUR_CONFIG, type TourId } from '@/features/tourhub/hooks/useOverviewData';
import { FONT } from '@/features/tourhub/_shared/tokens';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { analyticsEvents } from '@/utils/analyticsEvents';

const CANVAS = '#0D0F14';

/** The picker names the tour the whole page is reading. */
const PICKER_TOURS: TourId[] = ['pga', 'euro', 'lpga', 'liv', 'pgad', 'champ'];

export default function TourPage() {
  const [tour, setTour] = useState<TourId>('pga');
  const board = useTourBoardState(tour, setTour);

  useEffect(() => {
    analyticsEvents.track('tour_page_viewed', {});
  }, []);

  return (
    <div style={{ background: CANVAS, minHeight: '100dvh', fontFamily: FONT, ...FIGS }}>
      <TourHeader />
      <TourHero />

      <main style={{ padding: `14px 14px ${NAV_CLEARANCE}` }}>
        {/* THE PICKER IS THE PAGE'S SUBJECT. The page reads ONE TOUR AT A TIME:
            the picker names it and every block with a tour dimension follows.
            Tapping a tour moves the board to that tour's season race and sets Our
            Picks; tapping a race chip sets the picker. Two views of one state,
            which cannot disagree, so nothing is locked.
            THE ONE EXCEPTION IS COLLEGES — not a tour, so while it is the active
            board the picker is dimmed and reads "Colleges". Selecting any tour
            from there returns to that tour's season race. */}
        <RailChips
          options={
            board.pickerLock === 'colleges'
              ? [{ id: 'colleges', label: 'Colleges' }, ...PICKER_TOURS.map((id) => ({ id, label: TOUR_CONFIG[id].name }))]
              : PICKER_TOURS.map((id) => ({ id, label: TOUR_CONFIG[id].name }))
          }
          value={board.pickerLock ?? tour}
          locked={board.pickerLock != null}
          onChange={(next) => {
            analyticsEvents.track('tour_picker_changed', { tour: next });
            setTour(next as TourId);
          }}
          ariaLabel="Tour"
          style={{ margin: '0 -14px', padding: '0 14px' }}
        />

        <TourLeaderboardBlock state={board} />
        <TourPicksBlock tour={tour} />
        {/* COMING UP HAS NO TOUR DIMENSION, so the picker does not govern it: a
            member reading one tour still wants next week's whole calendar. */}
        <TourComingUpBlock />
        {/* The wire lands beneath. */}
      </main>
    </div>
  );
}
