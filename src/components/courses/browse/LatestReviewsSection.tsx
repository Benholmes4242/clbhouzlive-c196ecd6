import { ReviewRailSlot } from '../ReviewRailSlot';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { LatestReviewsShell } from './sectionShells';

/** No following section top padding: reproduce SECTION_WRAP's 14+20 seam here. */
export const LATEST_REVIEWS_WRAP = { ...SECTION_WRAP, paddingBottom: 34 };

/** LATEST REVIEWS — the page ends at these rails; no sheet (BRIEF_COURSES_PAGE_DEVICE_REVISION §2).
 *  LATEST_REVIEWS_MAGAZINE: kicker "In golfers' words", then the two rails. */
export function LatestReviewsSection({ reviews, onReviewPress, loading = false }: {
  reviews: LatestReview[];
  /** Waiting for reviews: draw the shell rather than nothing. */
  loading?: boolean;
  onReviewPress: (r: LatestReview) => void;
}) {
  // No heading without a rail: only a review a rail can show counts (same rules as ReviewRailSlot).
  const qualifies = reviews.some((r) => (r.media ?? []).length >= 1 || !!r.quote?.trim());
  if (!qualifies) return loading ? <LatestReviewsShell /> : null;
  return (
    <section style={LATEST_REVIEWS_WRAP}>
      <SectionHead tone="amber" kicker="In golfers' words" title="Latest reviews" />
      <div style={{ marginLeft: -16, marginRight: -16, marginTop: HEAD_GAP }}>
        <ReviewRailSlot reviews={reviews} onReviewPress={onReviewPress} />
      </div>
    </section>
  );
}
