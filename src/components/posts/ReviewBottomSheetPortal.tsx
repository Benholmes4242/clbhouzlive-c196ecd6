import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ReviewBottomSheet } from './ReviewBottomSheet';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { useCreationOverlayStore } from '@/stores/creationOverlayStore';
import { VideoEngine } from '@/video/VideoEngine';
import { useReviewFallback } from '@/hooks/useReviewFallback';
import { useReviewMedia } from './useReviewMedia';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCardOpenGate, useCoalescedBlocks } from '@/hooks/useCardOpenGate';
import { useContentReactions } from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { useFeedCommentPreview } from '@/hooks/feed/useFeedCommentPreview';

/**
 * Single root-level mount for ReviewBottomSheet.
 * Reads state from useReviewSheetStore — no props needed at this level.
 * Mount this once at app root; all `open()` calls from anywhere in the app
 * will render through here.
 *
 * Side effects:
 *  - On open: engine-wide pauseAll() so any playing feed video (Clubhouse,
 *    Watch, course media) stops while the review sheet reads over it.
 *  - On open: trap ESC to close the sheet (and stop propagation so the
 *    underlying overlay doesn't also dismiss).
 *  - On route change: auto-close any open sheet so stale state never persists.
 */
export const ReviewBottomSheetPortal: React.FC = () => {
  const isOpen = useReviewSheetStore((s) => s.isOpen);
  const payload = useReviewSheetStore((s) => s.payload);
  const close = useReviewSheetStore((s) => s.close);
  const location = useLocation();
  const hasText = !!payload?.reviewText;
  const hasBreakdown = !!payload?.breakdown && Object.values(payload.breakdown).some((value) => value != null);
  const fallbackQuery = useReviewFallback({ reviewId: payload?.reviewId ?? null, enabled: isOpen, hasText, hasBreakdown });
  const mediaQuery = useReviewMedia(payload?.reviewId ?? null, isOpen);
  const aggregateQuery = useCourseRatingAggregates(isOpen ? payload?.courseId : undefined);
  const reactionTargets = React.useMemo(
    () => (payload?.reviewId ? [{ type: 'review' as const, id: payload.reviewId }] : []),
    [payload?.reviewId],
  );
  const reactions = useContentReactions(reactionTargets);
  /**
   * G7.2(c) — THE REVIEW HAS COMMENTS NOW. comments_v2 carries target_type
   * 'review' on the review id, counted by get_story_engagement (the same counter
   * the likes use) and previewed by the batched comment read. This reverses
   * G3.2(d)/G3.3, which were right only while the target did not exist.
   */
  const reviewIdList = React.useMemo(
    () => (payload?.reviewId ? [payload.reviewId] : []),
    [payload?.reviewId],
  );
  const reviewEngagement = useStoryEngagement('review', reviewIdList);
  const commentCount = reviewEngagement.engagementFor(payload?.reviewId).commentCount;
  const previewIds = React.useMemo(
    () => (payload?.reviewId && commentCount > 0 ? [payload.reviewId] : []),
    [payload?.reviewId, commentCount],
  );
  const commentPreviews = useFeedCommentPreview(previewIds, 'review-card', 'review');
  /**
   * G2.2 — THE SUBJECT IS THE PROSE AND THE BREAKDOWN. The sheet does not open
   * until they are in hand, uncapped. G2.3 — the photographs and the course
   * aggregate are SUPPORTING: never dropped, only late, and the 900ms cap only
   * decides whether the card waits for them before opening.
   */
  const subjectReady = !payload?.reviewId || (hasText && hasBreakdown) || fallbackQuery.isFetched;
  /* ONE SET OF KEYS, BOTH CONSUMERS. The gate and the coalescer read the same
     object, so a key can never be honest for one and stale for the other.
     G4.1(b) — a read that is not asked for is trivially SETTLED. */
  const supportingKeys = React.useMemo(
    () => ({
      media: !payload?.reviewId || mediaQuery.isFetched,
      aggregate: !payload?.courseId || aggregateQuery.isFetched,
      reactions: !payload?.reviewId || reactions.isSettled,
      comments: !payload?.reviewId || reviewEngagement.isSettled,
      commentPreview: !payload?.reviewId
        || commentCount === 0
        || commentPreviews.isSettled(payload.reviewId),
    }),
    [payload?.reviewId, payload?.courseId, mediaQuery.isFetched, aggregateQuery.isFetched,
     reactions.isSettled, reviewEngagement.isSettled, commentCount, commentPreviews],
  );
  const gate = useCardOpenGate('review', isOpen, {
    subject: subjectReady,
    supporting: supportingKeys,
  });
  const supporting = useCoalescedBlocks(supportingKeys, gate.visible);
  const reactionState = payload?.reviewId ? reactions.stateFor('review', payload.reviewId) : null;

  // Pause every engine lane when the sheet opens. Null-caller = engine-wide
  // pause, which also passes the borrow-guard so a borrowed feed lane stops.
  // On close, bump the creation-overlay store so the visible feed surface
  // re-issues play-intent for its current active card (IG-standard resume).
  useEffect(() => {
    if (isOpen) {
      try { VideoEngine.pauseAll(); } catch {}
      return () => {
        try { useCreationOverlayStore.getState().notifyClosed(); } catch {}
      };
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
      isOpen={isOpen && gate.visible}
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
      resolvedReviewText={payload.reviewText ?? fallbackQuery.data?.reviewText ?? null}
      resolvedBreakdown={payload.breakdown ?? fallbackQuery.data?.breakdown ?? null}
      resolvedMedia={supporting.media ? mediaQuery.data ?? [] : undefined}
      resolvedAggregate={supporting.aggregate ? aggregateQuery.data ?? null : undefined}
      reactionCount={reactionState?.count ?? 0}
      reactionMine={!!reactionState?.mine}
      onToggleReaction={payload.reviewId ? () => reactions.toggle('review', payload.reviewId!) : undefined}
      reactionHidden={!reactions.viewerId || reactions.unavailable}
      proseSettled={subjectReady}
      reviewerStats={payload.reviewerStats ?? null}
    />
  );
};

export default ReviewBottomSheetPortal;
