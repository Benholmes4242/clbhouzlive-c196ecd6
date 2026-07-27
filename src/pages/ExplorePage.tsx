import React, { Suspense, lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AmateurCircuitHero } from '@/components/explore-tab-new/AmateurCircuitHero';
import CoursesPageHero from '@/components/courses/CoursesPageHero';
import { WireTicker } from '@/components/explore-tab-new/WireTicker';
import ExploreGridSkeleton from '@/components/explore-tab-new/ExploreGridSkeleton';
import { analyticsEvents } from '@/utils/analyticsEvents';

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
  const location = useLocation();

  useEffect(() => {
    const from = (location.state as { from?: string } | null)?.from ?? null;
    analyticsEvents.track('nav_discover_opened', { from });
    // Fire once per mount of the destination.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
