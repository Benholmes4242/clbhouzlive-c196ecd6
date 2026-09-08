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
import { useTourBoardState } from '@/features/tour/useTourBoardState';
import { TOUR_CONFIG, type TourId } from '@/features/tourhub/hooks/useOverviewData';
import { FONT } from '@/features/tourhub/_shared/tokens';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { analyticsEvents } from '@/utils/analyticsEvents';

const CANVAS = '#0D0F14';

/** The picker governs the live Leaderboard and Our Picks. Nothing else. */
const PICKER_TOURS: TourId[] = ['pga', 'euro', 'lpga', 'liv', 'pgad', 'champ'];

export default function TourPage() {
  const [tour, setTour] = useState<TourId>('pga');
  const board = useTourBoardState(tour);

  useEffect(() => {
    analyticsEvents.track('tour_page_viewed', {});
  }, []);

  return (
    <div style={{ background: CANVAS, minHeight: '100dvh', fontFamily: FONT, ...FIGS }}>
      <TourHeader />
      <TourHero />

      <main style={{ padding: `14px 14px ${NAV_CLEARANCE}` }}>
        {/* THE ONE PICKER, above the blocks it governs, saying so by sitting there.
            WHEN A FIXED-TOUR BOARD IS ACTIVE IT LOCKS to that board's tour —
            dimmed, never hidden, so nothing moves and the reader can see why it
            has stopped applying. The member's own selection is held in state and
            returns intact the moment the live board or Our Picks is active. */}
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
        {/* Our Picks, Coming Up and the wire land beneath, in that order. */}
      </main>
    </div>
  );
}
