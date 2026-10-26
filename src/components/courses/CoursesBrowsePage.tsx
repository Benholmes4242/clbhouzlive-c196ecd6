import React, { useCallback } from 'react';
import { HardestSection } from './browse/HardestSection';
import { LatestCoursesSection } from './browse/LatestCoursesSection';
import { LatestHolesSection } from './browse/LatestHolesSection';
import { LatestReviewsSection } from './browse/LatestReviewsSection';
import { useBrowseReviews } from './useBrowseReviews';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import StatBrowse from './StatBrowse';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './browse/SectionHead';
import { useCourseBrowseTruth } from './useStatBrowse';
import { HERO_FIGURE_LABEL, HERO_FIGURE_VALUE } from './CourseMasthead';
import { FiguresRowShell } from './browse/sectionShells';
import { GLASS_CHIP_CSS } from '@/styles/glassChip';
import { WhoPlayingSection } from './browse/WhoPlayingSection';
import { ByRegionSection, ALL_COURSES_ANCHOR } from './browse/ByRegionSection';
import { MostPlayedSection } from './browse/MostPlayedSection';
import { PageLoadGate, useSectionReady } from './browse/PageLoadGate';

const GATE_IDS = ['whoPlaying', 'byRegion', 'latestCourses', 'mostPlayed', 'hardest', 'latestHoles', 'latestReviews', 'figures'] as const;

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
  // Live head figures (BRIEF_COURSES_LIST_HEAD_STATS). HOLES is dropped, never
  // zeroed, when its count is unavailable to this viewer.
  const { data: truth, isLoading: truthLoading } = useCourseBrowseTruth();
  const fmt = (n: number) => n.toLocaleString('en-GB');
  const cells: Array<[string, number]> = truth
    ? ([
        ['Courses', truth.directoryTotal],
        ['Played', truth.playedCount],
        ['Rounds', truth.roundsTotal],
        ['Holes', truth.holesPlayed],
      ].filter((c): c is [string, number] => c[1] != null))
    : [];
  // The reviews rail is app-wide: no country, no region.
  const { pool: reviewPool, isLoading: reviewsLoading } = useBrowseReviews(null, null);
  const openReviewSheet = useReviewSheetStore((st) => st.open);
  const handleReviewTile = useCallback(
    (r: LatestReview) => {
      openReviewSheet({
        user: { id: r.userId ?? '', name: r.reviewerName, username: r.reviewerUsername ?? undefined, avatar: r.reviewerAvatar },
        courseId: r.courseId,
        courseName: r.courseName,
        rating: r.rating,
        reviewId: r.reviewId,
        courseCountry: r.courseCountry,
        courseRegion: r.courseRegion,
        courseSubCountry: r.courseSubCountry,
        reviewText: r.quote,
        breakdown: r.breakdown,
      });
    },
    [openReviewSheet],
  );

  return (
    <div>
      <style>{GLASS_CHIP_CSS}</style>
      <div style={BLEED}>
        <PageLoadGate expect={GATE_IDS}>
        <GateReport id="latestReviews" ready={!reviewsLoading} />
        <GateReport id="figures" ready={!truthLoading} />
        <WhoPlayingSection />
        <ByRegionSection />
        <LatestCoursesSection />
        <MostPlayedSection />
        <HardestSection />
        <LatestHolesSection />
        <LatestReviewsSection reviews={reviewPool} onReviewPress={handleReviewTile} loading={reviewsLoading} />
        <section id={ALL_COURSES_ANCHOR} style={SECTION_WRAP}>
          <SectionHead tone="quiet" kicker="Every course we hold" />
          {cells.length > 0 ? (
            <div style={{ display: 'flex', marginTop: HEAD_GAP }}>
              {cells.map(([label, value]) => (
                <div key={label} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <span style={HERO_FIGURE_LABEL}>{label}</span>
                  <span style={HERO_FIGURE_VALUE}>{fmt(value)}</span>
                </div>
              ))}
            </div>
          ) : truthLoading ? (
            <FiguresRowShell />
          ) : null}
        </section>
        </PageLoadGate>
      </div>
      <StatBrowse onOpenDirectory={onOpenDirectory} />
    </div>
  );
}
