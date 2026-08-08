// TEMPORARY measurement harness for BRIEF_REVIEW_TILE_AUTOPLAY. Deleted after
// the numbers are taken; not referenced from any shipped route.
import { useMemo } from 'react';
import { ReviewTile } from '@/components/explore-tab-new/courseled/ReviewTile';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

const VID = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';
const POSTER = 'https://placehold.co/400x400/222/fff.png';

export default function ReviewAutoplayStress() {
  const rows = useMemo<LatestReview[]>(
    () =>
      Array.from({ length: 60 }).map((_, i) => ({
        reviewId: `r${i}`,
        userId: `u${i}`,
        reviewerName: `Member ${i}`,
        courseId: `c${i}`,
        courseName: `Course ${i}`,
        courseImage: null,
        rating: 8.4,
        at: new Date().toISOString(),
        mediaType: i % 3 === 0 ? 'video' : 'photo',
        mediaUrl: i % 3 === 0 ? VID : POSTER,
        posterUrl: POSTER,
      })) as unknown as LatestReview[],
    [],
  );

  return (
    <div style={{ height: '100dvh', overflowY: 'auto' }} id="stress-scroll">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 14 }}>
        {rows.map((r) => (
          <ReviewTile key={r.reviewId} review={r} autoplayGroup="reviews-sheet" onPress={() => {}} />
        ))}
      </div>
    </div>
  );
}
