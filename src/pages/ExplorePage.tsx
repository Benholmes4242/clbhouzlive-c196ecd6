import { Suspense, lazy } from 'react';
import DiscoverCourseLedSkeleton from '@/components/explore-tab-new/courseled/DiscoverCourseLedSkeleton';

const ExploreTabContent = lazy(() => import('@/components/explore-tab-new/ExploreTabContent'));

/**
 * ExplorePage — standalone Discover surface at /explore.
 *
 * Course-led Discover no longer renders a page-level header; the top slot is
 * occupied by the rate nudge when a course is available, otherwise by the
 * "Your Circle" friends rail. The old cinematic hero and wire ticker are
 * unmounted here: the brief's page order starts directly with the first rail.
 * WireTicker survives as a component because the Tour Hub hybrid hero still
 * renders it; AmateurCircuitHero is left in the tree unreferenced pending Ben's
 * verdict.
 */
export default function ExplorePage() {
  return (
    <div>
      <Suspense fallback={<DiscoverCourseLedSkeleton />}>
        <ExploreTabContent />
      </Suspense>
    </div>
  );
}
