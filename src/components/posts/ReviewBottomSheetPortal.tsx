import React, { useEffect } from 'react';
import { ReviewBottomSheet } from './ReviewBottomSheet';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';

/**
 * Single root-level mount for ReviewBottomSheet.
 * Reads state from useReviewSheetStore — no props needed at this level.
 * Mount this once at app root; all `open()` calls from anywhere in the app
 * will render through here.
 *
 * Side effect: when the sheet opens, pause all currently-playing <video>
 * elements and resume those that were playing on close.
 */
export const ReviewBottomSheetPortal: React.FC = () => {
  const isOpen = useReviewSheetStore((s) => s.isOpen);
  const payload = useReviewSheetStore((s) => s.payload);
  const close = useReviewSheetStore((s) => s.close);

  useEffect(() => {
    if (isOpen) {
      document.querySelectorAll('video').forEach((v) => {
        if (!v.paused) {
          v.dataset.wasPlayingBeforeReviewSheet = 'true';
          try { v.pause(); } catch { /* ignore */ }
        }
      });
    } else {
      document
        .querySelectorAll<HTMLVideoElement>('video[data-was-playing-before-review-sheet="true"]')
        .forEach((v) => {
          delete v.dataset.wasPlayingBeforeReviewSheet;
          v.play().catch(() => { /* autoplay rejection ok */ });
        });
    }
  }, [isOpen]);

  if (!payload) return null;

  return (
    <ReviewBottomSheet
      isOpen={isOpen}
      onClose={close}
      user={payload.user}
      courseId={payload.courseId}
      courseName={payload.courseName}
      rating={payload.rating}
      reviewId={payload.reviewId ?? undefined}
      courseCountry={payload.courseCountry}
      courseRegion={payload.courseRegion}
      courseSubCountry={payload.courseSubCountry}
      reviewText={payload.reviewText}
    />
  );
};

export default ReviewBottomSheetPortal;
