import { ReviewRailSlot } from '../ReviewRailSlot';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';

/** LATEST REVIEWS — the page ends at this rail; no sheet (BRIEF_COURSES_PAGE_DEVICE_REVISION §2). */
export function LatestReviewsSection({ reviews, onReviewPress }: {
  reviews: LatestReview[];
  onReviewPress: (r: LatestReview) => void;
}) {
  if (reviews.length === 0) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead tone="amber" kicker="In members' words" title="Latest reviews" subline="What members said after they played." />
      <div style={{ marginLeft: -16, marginRight: -16, marginTop: HEAD_GAP }}>
        <ReviewRailSlot reviews={reviews} onReviewPress={onReviewPress} />
      </div>
    </section>
  );
}
