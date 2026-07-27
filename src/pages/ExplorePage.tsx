import React, { Suspense, lazy } from 'react';
import { AmateurCircuitHero } from '@/components/explore-tab-new/AmateurCircuitHero';
import CoursesPageHero from '@/components/courses/CoursesPageHero';
import { WireTicker } from '@/components/explore-tab-new/WireTicker';
import ExploreGridSkeleton from '@/components/explore-tab-new/ExploreGridSkeleton';

const ExploreTabContent = lazy(() => import('@/components/explore-tab-new/ExploreTabContent'));

/**
 * ExplorePage — standalone Discover surface at /explore.
 *
 * Previously rendered embedded inside CoursesContent's "discover" tab. The
 * shell it needed (cinematic hero + wire ticker) is reproduced here; the
 * shellTabs slot is intentionally omitted because Discover no longer sits
 * inside the Courses tab row.
 */
export default function ExplorePage() {
  return (
    <div>
      <AmateurCircuitHero fallback={<CoursesPageHero />} />
      <WireTicker />
      <Suspense fallback={<ExploreGridSkeleton />}>
        <ExploreTabContent />
      </Suspense>
    </div>
  );
}
