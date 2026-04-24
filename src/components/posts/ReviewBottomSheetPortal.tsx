import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ReviewBottomSheet } from './ReviewBottomSheet';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { pauseAllAudio } from '@/utils/globalVideoMute';

/**
 * Single root-level mount for ReviewBottomSheet.
 * Reads state from useReviewSheetStore — no props needed at this level.
 * Mount this once at app root; all `open()` calls from anywhere in the app
 * will render through here.
 *
 * Side effects:
 *  - On open: mute all registered audio sources (video underneath keeps playing
 *    silently, matching how FullscreenFeedOverlay/MediaViewerOverlay behave).
 *  - On open: trap ESC to close the sheet (and stop propagation so the
 *    underlying overlay doesn't also dismiss).
 *  - On route change: auto-close any open sheet so stale state never persists.
 */
export const ReviewBottomSheetPortal: React.FC = () => {
  const isOpen = useReviewSheetStore((s) => s.isOpen);
  const payload = useReviewSheetStore((s) => s.payload);
  const close = useReviewSheetStore((s) => s.close);
  const location = useLocation();

  // Mute audio sources when the sheet opens. We don't auto-resume on close —
  // the user's mute preference and the SnapFeed mutex take over.
  useEffect(() => {
    if (isOpen) {
      pauseAllAudio();
    }
  }, [isOpen]);

  // ESC closes the sheet (with stopPropagation so underlying overlays don't react).
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Close on route change — handles browser back/forward and any unexpected nav.
  // location.key changes on every navigation including back/forward.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

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
      breakdown={payload.breakdown ?? null}
      reviewerStats={payload.reviewerStats ?? null}
    />
  );
};

export default ReviewBottomSheetPortal;
