/**
 * OverviewV4Page — thin composer. Owns tour selection state and threads it
 * through hero + tour-keyed sections. Rankings chips are independent.
 */

import { useState } from 'react';
import { useTourEventContext } from './data/useTourEventContext';
import { HeroV4 } from './hero/HeroV4';
import { OnTheCourse } from './sections/OnTheCourse';
import { TIPicksCarousel } from './sections/TIPicksCarousel';
import { WorldRankings } from './sections/WorldRankings';
import { StatOfTheWeek } from '../components/StatOfTheWeek';
import { ComingUp } from './sections/ComingUp';
import { CollegeFranchiseSection } from './sections/CollegeFranchiseSection';
import { HomeCourseOfWeekModule } from '../components/home/HomeCourseOfWeekModule';
import { ConnectHandicapCTA } from './sections/ConnectHandicapCTA';
import { V4 } from './tokens';
import type { TourId } from '../hooks/useOverviewData';

export function OverviewV4Page() {
  const [tour, setTour] = useState<TourId>('pga');
  const { data: ctx } = useTourEventContext(tour);
  const state = ctx?.state ?? 'upcoming';
  const isLive = state === 'live';

  return (
    <main style={{ minHeight: '100vh', background: V4.bg, paddingBottom: 40 }}>
      <HeroV4 ctx={ctx} tour={tour} onTourChange={setTour} />
      {isLive ? <OnTheCourse tournamentId={ctx?.event?.id} live={isLive} /> : null}
      <TIPicksCarousel tournamentId={ctx?.event?.id} state={state} />
      <WorldRankings />
      <StatOfTheWeek />
      <ComingUp tour={tour} />
      <CollegeFranchiseSection />
      <HomeCourseOfWeekModule />
      <ConnectHandicapCTA />
    </main>
  );
}

export default OverviewV4Page;
