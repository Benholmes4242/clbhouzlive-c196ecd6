import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReviewTile } from './ReviewTile';
import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { Eyebrow, InkAction } from './tokens';

import type { LatestReview } from './hooks/useLatestReviews';

/**
 * LATEST REVIEWS — slot 3 on Discover (BRIEF_LATEST_REVIEWS).
 *
 * Every other section on the page reports a statistic. This is the only place
 * carrying an OPINION, so the words are treated as content: a two-column mosaic
 * of six fixed-height tiles, each one a quote on the review's own photography.
 *
 * Placed between "On tour this week" and "Around the world" on purpose — the
 * reviews mosaic and the Moments mosaic read alike, so Around the world sits
 * between them and keeps the two apart.
 *
 * With no qualifying reviews the section renders NOTHING (no eyebrow, no empty
 * panel), so the page's 28px section rhythm collapses cleanly.
 */

const PAGE_CAP = 6;

interface Props {
  reviews: LatestReview[];
  /** Total qualifying reviews behind the sheet (the mosaic is capped at six). */
  totalCount?: number | null;
  viewerId?: string;
  onTilePress: (r: LatestReview) => void;
  onSeeAll: () => void;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
}

export function LatestReviews({
  reviews,
  totalCount,
  viewerId,
  onTilePress,
  onSeeAll,
  lastSeen = null,
}: Props) {
  const { t } = useTranslation('courses');

  const shown = reviews.slice(0, PAGE_CAP);

  // REACTIONS — one read for the mosaic, keyed by review id.
  const reactionTargets = useMemo<ReactionTarget[]>(
    () => shown.map((r) => ({ type: 'review' as const, id: r.reviewId })),
    [shown],
  );
  const reactions = useContentReactions(reactionTargets);

  // NEW SINCE: the review's created_at, the stamp the section already sorts by.
  const newCount = countNewSince(shown, (r) => r.at, lastSeen);
  useReportNewCount('reviews', newCount);

  if (reviews.length === 0) return null;
  const total = totalCount ?? reviews.length;

  return (
    <section>
      <Eyebrow
        dot={newCount > 0}
        aside={
          total > shown.length ? (
            <InkAction onClick={onSeeAll}>{t('discover.seeAll', 'See all')}</InkAction>
          ) : undefined
        }
      >
        {t('discover.latestReviews', 'Latest reviews')}
      </Eyebrow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {shown.map((r) => {
          const st = reactions.stateFor('review', r.reviewId);
          const own = !!viewerId && r.userId === viewerId;
          return (
            <ReviewTile
              key={r.reviewId}
              review={r}
              isOwn={own}
              isNew={isNewSince(r.at, lastSeen)}
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
    </section>
  );
}


export default LatestReviews;
