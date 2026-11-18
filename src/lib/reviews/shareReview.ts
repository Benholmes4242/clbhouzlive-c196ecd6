import { analyticsEvents } from '@/utils/analyticsEvents';
import { toast } from '@/lib/toast';

/** The one review share: the course Reviews tab focused on this review.
 *  Used by the review card and the fullscreen viewer's share pill. */
export function shareReview(args: { reviewId: string; courseId: string; courseName: string; authorName: string }) {
  const { reviewId, courseId, courseName, authorName } = args;
  const shareUrl = `${window.location.origin}/courses/${courseId}?tab=reviews&review=${reviewId}`;
  analyticsEvents.track('review_share_opened', { review_id: reviewId, course_id: courseId });
  if (navigator.share) {
    navigator.share({ title: courseName, text: `${authorName}'s review of ${courseName}`, url: shareUrl }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied');
  }
}
