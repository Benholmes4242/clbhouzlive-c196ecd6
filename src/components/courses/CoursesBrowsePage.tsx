import React, { useCallback, useState } from 'react';
import { HardestSection } from './browse/HardestSection';
import { HighestRatedSection } from './browse/HighestRatedSection';
import { UnclaimedSection } from './browse/UnclaimedSection';
import { LatestReviewsSection } from './browse/LatestReviewsSection';
import { useBrowseReviews } from './useBrowseReviews';
import { LatestReviewsSheet } from '@/components/explore-tab-new/courseled/LatestReviewsSheet';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';
import StatBrowse from './StatBrowse';
import { SectionHead, SECTION_WRAP } from './browse/SectionHead';
import { useCourseBrowseTruth, useStatBrowseFacets } from './useStatBrowse';
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
 * Owns the LatestReviewsSheet so section 07 and section 08 open the same sheet.
 */
interface Props {
  onOpenDirectory: React.ComponentProps<typeof StatBrowse>['onOpenDirectory'];
}

// The page sits inside CoursesContent's px-4 wrapper; sections carry their
// own 16px gutter, so they cancel it rather than doubling it.
const BLEED: React.CSSProperties = { marginLeft: -16, marginRight: -16 };


export default function CoursesBrowsePage({ onOpenDirectory }: Props) {
  const { data: facets } = useStatBrowseFacets();
  const { data: truth } = useCourseBrowseTruth();
  // The list browses the analytics-ready population (stat_browse_base), so the
  // heading counts that population, not every course with any tracked round.
  const total = facets?.played_total;
  const { user } = useSupabaseSession();
  // Section 07 is app-wide: no country, no region.
  const { pool: reviewPool } = useBrowseReviews(null, null);
  const [reviewsSheet, setReviewsSheet] = useState(false);
  const openReviewSheet = useReviewSheetStore((st) => st.open);
  const openReviewsSheet = useCallback(() => {
    analyticsEvents.track('stat_browse_reviews_sheet_open', { country: null, region: null, pool: reviewPool.length });
    setReviewsSheet(true);
  }, [reviewPool.length]);
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
        <UnclaimedSection />
        <LatestReviewsSection reviews={reviewPool} onReviewPress={handleReviewTile} onSeeAll={openReviewsSheet} />
        <section id={ALL_COURSES_ANCHOR} style={SECTION_WRAP}>
          <SectionHead
            n="08"
            tone="quiet"
            kicker="Everything we track"
            title={total ? `All ${total.toLocaleString('en-GB')} courses` : 'All courses'}
            subline={
              truth
                ? `Filter and sort. ${truth.ratedTotal.toLocaleString('en-GB')} carry a community rating.`
                : 'Filter and sort.'
            }
          />
        </section>
      </div>
      <StatBrowse onOpenDirectory={onOpenDirectory} />
      <LatestReviewsSheet
        open={reviewsSheet}
        onClose={() => setReviewsSheet(false)}
        reviews={reviewPool}
        viewerId={user?.id}
        onTilePress={handleReviewTile}
      />
    </div>
  );
}
