/**
 * OverviewV4Page — thin composer. Owns tour state; threads through hero +
 * tour-keyed sections. World Rankings chips remain independent.
 */

import { useState } from 'react';
import { useTourEventContext } from './data/useTourEventContext';
import { HeroV4 } from './hero/HeroV4';
import { OnTheCourse } from './sections/OnTheCourse';
import { TIPicksCarousel } from './sections/TIPicksCarousel';
import { WorldRankings } from './sections/WorldRankings';
import { StatOfTheWeekV4 } from './sections/StatOfTheWeekV4';
import { ComingUp } from './sections/ComingUp';
import { CollegeFranchiseSection } from './sections/CollegeFranchiseSection';
import { CourseOfTheWeekV4 } from './sections/CourseOfTheWeekV4';
import { ConnectHandicapCTA } from './sections/ConnectHandicapCTA';
import { V4 } from './tokens';
import type { TourId } from '../hooks/useOverviewData';

export function OverviewV4Page() {
  const [tour, setTour] = useState<TourId>('pga');
  const { data: ctx } = useTourEventContext(tour);
  const state = ctx?.state ?? 'upcoming';
  const isLive = state === 'live';

  return (
    <main style={{ minHeight: '100vh', background: V4.bg, paddingBottom: 48 }}>
      <HeroV4 ctx={ctx} tour={tour} onTourChange={setTour} />
      {isLive ? <OnTheCourse tournamentId={ctx?.event?.id} live={isLive} /> : null}
      <TIPicksCarousel tournamentId={ctx?.event?.id} state={state} />
      <WorldRankings tour={tour} />
      <StatOfTheWeekV4 />
      <ComingUp tour={tour} />
      <CollegeFranchiseSection />
      <CourseOfTheWeekV4 />
      <ConnectHandicapCTA />
    </main>
  );
}

export default OverviewV4Page;
