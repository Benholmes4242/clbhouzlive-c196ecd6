import React, { useCallback } from 'react';
import { LatestHolesSection } from './browse/LatestHolesSection';
import { LatestReviewsSection } from './browse/LatestReviewsSection';
import { useBrowseReviews } from './useBrowseReviews';
import { useOpenLatestReview } from './browse/useOpenLatestReview';
import StatBrowse from './StatBrowse';
import { useCourseBrowseTruth } from './useStatBrowse';
import { LatestHolesShell, WhoPlayingShell } from './browse/sectionShells';
import { GLASS_CHIP_CSS } from '@/styles/glassChip';
import { WhoPlayingSection } from './browse/WhoPlayingSection';
import { StandoutRoundsSection } from './browse/StandoutRoundsSection';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { PageLoadGate, settled, useSectionReady } from './browse/PageLoadGate';

const GATE_IDS = ['whoPlaying', 'standoutRounds', 'latestHoles', 'latestReviews', 'figures', 'list'] as const;

/** Reports page-owned readiness from inside the gate's context. */
function GateReport({ id, ready }: { id: string; ready: boolean }) {
  useSectionReady(id, ready);
  return null;
}

/**
 * CoursesBrowsePage — the Courses tab: five sections above the list
 * (BRIEF_COURSES_PAGE_REBUILD, revised by DEVICE_REVISION). Holds no layout
 * beyond stacking them. The sections above the list are app-wide and never read the country/region URL params;
 * those belong to section 08 (StatBrowse) alone.
 *
 * Opens no bottom sheet: the page ends at the reviews rail (DEVICE_REVISION §2).
 */
interface Props {
  onOpenDirectory: React.ComponentProps<typeof StatBrowse>['onOpenDirectory'];
}

// The page sits inside CoursesContent's px-4 wrapper; sections carry their
// own 16px gutter, so they cancel it rather than doubling it.
const BLEED: React.CSSProperties = { marginLeft: -16, marginRight: -16 };


export default function CoursesBrowsePage({ onOpenDirectory }: Props) {
  // The head's figures now live in the list itself (ListScopeHeader,
  // BRIEF_COURSES_LIST_PHOTO_CARDS §2). The page keeps only the readiness
  // report that gates them.
  const { user, loading: sessionLoading } = useSupabaseSession();
  const truthQuery = useCourseBrowseTruth();
  // The reviews rail is app-wide: no country, no region.
  const { pool: reviewPool, isLoading: reviewsLoading, isPending: reviewsPending } = useBrowseReviews(null, null);
  const handleReviewTile = useOpenLatestReview();

  return (
    <div>
      <style>{GLASS_CHIP_CSS}</style>
      <PageLoadGate expect={GATE_IDS} fallback={
        <div data-courses-fallback="" style={BLEED}>
          {/* FIX_COURSES_GUEST_LOADING_SHELL: signed out, the first section a
              visitor actually sees is Latest holes (Standout rounds renders nothing
              for guests), so its own shell leads. */}
          {user ? <WhoPlayingShell /> : <LatestHolesShell />}
        </div>
      }>
      <div style={BLEED}>
        <GateReport id="latestReviews" ready={!sessionLoading && settled({ status: reviewsPending ? 'pending' : 'success' }) } />
        <GateReport id="figures" ready={!sessionLoading && settled(truthQuery)} />
        <WhoPlayingSection />
        <StandoutRoundsSection />
        <LatestHolesSection />
        <LatestReviewsSection reviews={reviewPool} onReviewPress={handleReviewTile} loading={reviewsLoading} />
      </div>
      <StatBrowse onOpenDirectory={onOpenDirectory} />
      </PageLoadGate>
    </div>
  );
}
