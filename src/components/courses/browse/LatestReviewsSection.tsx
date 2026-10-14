import { ReviewRailSlot } from '../ReviewRailSlot';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';

/** SECTION 07 — LATEST REVIEWS (§8). The sheet is mounted by CoursesBrowsePage. */
export function LatestReviewsSection({ reviews, onReviewPress, onSeeAll }: {
  reviews: LatestReview[];
  onReviewPress: (r: LatestReview) => void;
  onSeeAll: () => void;
}) {
  if (reviews.length === 0) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead n="07" tone="amber" kicker="In members' words" title="Latest reviews" subline="What members said after they played." />
      <div style={{ marginLeft: -16, marginRight: -16, marginTop: HEAD_GAP }}>
        <ReviewRailSlot reviews={reviews} onReviewPress={onReviewPress} />
      </div>
      {/* Same amber, scale and trailing chevron as the regions control tile,
          different noun — but NO count. The pool is capped and the sheet does
          not page, so a figure here could only be wrong (see useBrowseReviews). */}
      <button type="button" onClick={onSeeAll} style={{ marginTop: 12, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 24, fontWeight: 700, letterSpacing: '-0.036em', lineHeight: 1.1, color: A.AMBER, fontVariantNumeric: 'tabular-nums' }}>
        {`All reviews \u203A`}
      </button>
    </section>
  );
}
