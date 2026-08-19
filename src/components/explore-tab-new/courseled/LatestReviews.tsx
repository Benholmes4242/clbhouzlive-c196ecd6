import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReviewTile, reviewTier } from './ReviewTile';
import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { Eyebrow, InkAction } from './tokens';
import { ReviewsMosaic as ReviewsMosaicShell } from './DiscoverCourseLedSkeleton';

import type { LatestReview } from './hooks/useLatestReviews';

/**
 * LATEST REVIEWS — slot 3 on Discover (BRIEF_LATEST_REVIEWS).
 *
 * Every other section on the page reports a statistic. This is the only place
 * carrying an OPINION, so the words are treated as content: a two-column mosaic
 * of four fixed-height photo tiles, one per review.
 *
 * Placed between "On tour this week" and "Around the world" on purpose — the
 * reviews mosaic and the Moments mosaic read alike, so Around the world sits
 * between them and keeps the two apart.
 *
 * With no qualifying reviews the section renders NOTHING (no eyebrow, no empty
 * panel), so the page's 28px section rhythm collapses cleanly.
 */

const SEARCH_CAP = 4; // how far down the list we look for a featured review
const GRID_CAP = 2;   // how many tiles the grid renders

interface Props {
  reviews: LatestReview[];
  /** Total qualifying reviews behind the sheet (the mosaic is capped at three). */
  totalCount?: number | null;
  /** TRUE while the reviews query has not settled — the shell holds the slot. */
  isPending?: boolean;
  viewerId?: string;
  onTilePress: (r: LatestReview) => void;
  onSeeAll: () => void;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
}

export function LatestReviews({
  reviews,
  totalCount,
  isPending = false,
  viewerId,
  onTilePress,
  onSeeAll,
  lastSeen = null,
}: Props) {
  const { t } = useTranslation('courses');

  /* TIERS (BRIEF_REVIEW_TILE_TIERS §1/§2). At most ONE featured tile per
     render: the MOST RECENT qualifier in the page's own window — the list is
     created_at DESC, so that is simply the first. A second qualifier renders
     as BARS in the grid.

     The grid carries GRID_CAP tiles so the two columns stay even, whether or
     not a featured tile was lifted out. GRID_CAP is 2 - one row - because
     Discover now carries two video rails and this section was taking four rows
     of a scroll it no longer owns. SEARCH_CAP stays wider than GRID_CAP on
     purpose: a featured review is the best thing this section has and it
     should still be found when it is third or fourth newest. */
  const pool = reviews.slice(0, SEARCH_CAP);
  const featured = pool.find((r) => reviewTier(r) === 'featured') ?? null;
  const grid = reviews
    .filter((r) => r.reviewId !== featured?.reviewId)
    .slice(0, GRID_CAP);
  const shown = featured ? [featured, ...grid] : grid;



  // REACTIONS — one read for the mosaic, keyed by review id.
  const reactionTargets = useMemo<ReactionTarget[]>(
    () => shown.map((r) => ({ type: 'review' as const, id: r.reviewId })),
    [shown],
  );
  const reactions = useContentReactions(reactionTargets);

  // NEW SINCE: the review's created_at, the stamp the section already sorts by.
  // Not computed before settle.
  const newCount = isPending ? 0 : countNewSince(shown, (r) => r.at, lastSeen);
  useReportNewCount('reviews', newCount);

  // UNRESOLVED IS NOT ABSENT: a shell while in flight, nothing once settled empty.
  if (isPending) return <ReviewsMosaicShell />;
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

      {featured && (() => {
        const st = reactions.stateFor('review', featured.reviewId);
        const own = !!viewerId && featured.userId === viewerId;
        return (
          <div style={{ marginBottom: 8 }}>
            <ReviewTile
              key={featured.reviewId}
              review={featured}
              isOwn={own}
              isNew={isNewSince(featured.at, lastSeen)}
              onPress={onTilePress}
              tier="featured"
              reactionHidden={!reactions.viewerId || reactions.unavailable}
              reactionReadOnly={own}
              reactionCount={st.count}
              reacted={st.mine}
              onToggleReaction={() => reactions.toggle('review', featured.reviewId)}
            />
          </div>
        );
      })()}

      {/* PLAIN GRID, NOT A MEASURED MASONRY (§5.1) — no estimator here, so
          variable tile heights cannot drift the columns. alignItems: 'start'
          stops a compact tile stretching to its taller neighbour, which would
          read as a gap under the figures rather than rhythm (§5.3). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'start',
          gap: 8,
        }}
      >
        {grid.map((r) => {
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
