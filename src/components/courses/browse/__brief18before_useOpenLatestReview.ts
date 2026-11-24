/**
 * The one LatestReview → review sheet mapping (FIX_LATEST_REVIEW_TAP). The
 * Latest reviews section and the What's been played LATEST REVIEW card both
 * open through it, so the sheet's fields cannot drift between them.
 */
import { useCallback } from 'react';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';

export function useOpenLatestReview() {
  const openReviewSheet = useReviewSheetStore((st) => st.open);
  return useCallback(
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
}
