import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ReviewTile } from './ReviewTile';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';

import { A, KICKER, SANS, FIGS } from './tokens';
import type { LatestReview } from './hooks/useLatestReviews';

/**
 * LATEST REVIEWS SHEET (BRIEF_LATEST_REVIEWS, section 5).
 *
 * The same mosaic tile, uncapped and paginated in pages of
 * LATEST_REVIEWS_PAGE_SIZE (24). A tile tap opens the shared review sheet
 * STACKED ABOVE this one — ReviewBottomSheet lives at REVIEW_SHEET_Z (240), so
 * this sheet is deliberately based below it and stays open beneath.
 */

const SHEET_Z_UNDER_REVIEW = 150;

interface Props {
  open: boolean;
  onClose: () => void;
  reviews: LatestReview[];
  totalCount?: number | null;
  viewerId?: string;
  onTilePress: (r: LatestReview) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function LatestReviewsSheet({
  open,
  onClose,
  reviews,
  totalCount,
  viewerId,
  onTilePress,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: Props) {
  const { t } = useTranslation('courses');
  const sentinel = useRef<HTMLDivElement | null>(null);

  // REACTIONS — one read for the loaded page set, keyed by review id.
  const reactionTargets = useMemo<ReactionTarget[]>(
    () => reviews.map((r) => ({ type: 'review' as const, id: r.reviewId })),
    [reviews],
  );
  const reactions = useContentReactions(reactionTargets);


  useEffect(() => {
    if (!open || !hasNextPage || !onLoadMore) return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) onLoadMore();
      },
      { rootMargin: '240px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [open, hasNextPage, isFetchingNextPage, onLoadMore]);

  const total = totalCount ?? reviews.length;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-reviews-title"
      variant="light"
      surfaceColor={A.CANVAS}
      zIndexBase={SHEET_Z_UNDER_REVIEW}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div style={{ ...KICKER, color: A.DIM, marginBottom: 5, ...FIGS }}>
          {t('discover.reviews.sheetCaption', {
            defaultValue: '{{count}} reviews',
            count: total,
          })}
        </div>
        <div
          id="courseled-reviews-title"
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: A.INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {t('discover.latestReviews', 'Latest reviews')}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {reviews.map((r) => {
            const st = reactions.stateFor('review', r.reviewId);
            const own = !!viewerId && r.userId === viewerId;
            return (
              <ReviewTile
                key={r.reviewId}
                review={r}
                isOwn={own}
                autoplayGroup="reviews-sheet"
                onPress={onTilePress}
                reactionHidden={!reactions.viewerId || reactions.unavailable}
                reactionReadOnly={own}
                reactionCount={st.count}
                reacted={st.mine}
                onToggleReaction={() => reactions.toggle('review', r.reviewId)}
              />
            );
          })}
        </div>

        <div ref={sentinel} aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default LatestReviewsSheet;
