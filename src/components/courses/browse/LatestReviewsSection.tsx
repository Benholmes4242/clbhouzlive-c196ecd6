import { ReviewRailSlot } from '../ReviewRailSlot';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { LatestReviewsShell } from './sectionShells';

/** LATEST REVIEWS — the page ends at this rail; no sheet (BRIEF_COURSES_PAGE_DEVICE_REVISION §2). */
export function LatestReviewsSection({ reviews, onReviewPress, loading = false }: {
  reviews: LatestReview[];
  /** Waiting for reviews: draw the shell rather than nothing. */
  loading?: boolean;
  onReviewPress: (r: LatestReview) => void;
}) {
  if (reviews.length === 0) return loading ? <LatestReviewsShell /> : null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead tone="amber" kicker="In members' words" title="Latest reviews" />
      <div style={{ marginLeft: -16, marginRight: -16, marginTop: HEAD_GAP }}>
        <ReviewRailSlot reviews={reviews} onReviewPress={onReviewPress} />
      </div>
    </section>
  );
}
