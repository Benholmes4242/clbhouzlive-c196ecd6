import React, { useCallback } from 'react';
import { HardestSection } from './browse/HardestSection';
import { HighestRatedSection } from './browse/HighestRatedSection';
import { LatestReviewsSection } from './browse/LatestReviewsSection';
import { useBrowseReviews } from './useBrowseReviews';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import StatBrowse from './StatBrowse';
import { SectionHead, SECTION_WRAP } from './browse/SectionHead';
import { useStatBrowseFacets } from './useStatBrowse';
import { GLASS_CHIP_CSS } from '@/styles/glassChip';
import { WhoPlayingSection } from './browse/WhoPlayingSection';
import { ByRegionSection, ALL_COURSES_ANCHOR } from './browse/ByRegionSection';
import { MostPlayedSection } from './browse/MostPlayedSection';

/**
 * CoursesBrowsePage — the Courses tab as eight stacked sections
 * (BRIEF_COURSES_PAGE_REBUILD). Holds no layout beyond stacking them.
 * Sections 01–07 are app-wide and never read the country/region URL params;
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
  const { data: facets } = useStatBrowseFacets();
  // The list browses the analytics-ready population (stat_browse_base), so the
  // heading counts that population, not every course with any tracked round.
  const total = facets?.played_total;
  // Same derivation StatBrowse uses for its directory floor.
  const directoryRemaining =
    facets?.directory_total != null && facets?.played_total != null
      ? Math.max(0, facets.directory_total - facets.played_total)
      : null;
  // Section 07 is app-wide: no country, no region.
  const { pool: reviewPool } = useBrowseReviews(null, null);
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
        <WhoPlayingSection />
        <ByRegionSection />
        <MostPlayedSection />
        <HardestSection />
        <HighestRatedSection />
        <LatestReviewsSection reviews={reviewPool} onReviewPress={handleReviewTile} />
        <section id={ALL_COURSES_ANCHOR} style={SECTION_WRAP}>
          <SectionHead
            tone="quiet"
            kicker="Played by members"
            title={
              total != null && directoryRemaining != null
                ? `${total.toLocaleString('en-GB')} courses, ${directoryRemaining.toLocaleString('en-GB')} more`
                : 'Courses'
            }
            subline="These are the courses a member has posted a full round at, so every figure on them is real. The rest of the directory is one tap below."
          />
        </section>
      </div>
      <StatBrowse onOpenDirectory={onOpenDirectory} />
    </div>
  );
}
