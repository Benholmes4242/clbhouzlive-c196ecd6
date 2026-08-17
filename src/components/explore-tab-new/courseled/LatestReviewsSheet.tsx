import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ReviewTile, reviewTier } from './ReviewTile';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';

import { A, KICKER, SANS, FIGS } from './tokens';
import type { LatestReview } from './hooks/useLatestReviews';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

/**
 * LATEST REVIEWS SHEET (BRIEF_LATEST_REVIEWS, section 5).
 *
 * The same mosaic tile, uncapped and paginated in pages of
 * LATEST_REVIEWS_PAGE_SIZE (24). A tile tap opens the shared review sheet
 * STACKED ABOVE this one — ReviewBottomSheet lives at REVIEW_SHEET_Z (240), so
 * this sheet is deliberately based below it and stays open beneath.
 *
 * REGION FILTER (BRIEF_LATEST_REVIEWS_CRAFT_AND_FILTER, section 4).
 * The region comes from `golf_courses.country`, which despite its name already
 * holds the COARSE bucket ('Britain & Ireland' | 'USA' | 'Continental Europe' |
 * 'Oceania' | 'Asia' | ...), carried on the review row as `courseCountry`. So
 * GB&I is definable without the geo_regions vocabulary and without SQL.
 *
 * "Rest of the world" is DEFINED BY EXCLUSION, never by a list: a course in a
 * bucket nobody enumerated (or with no bucket at all) still belongs to exactly
 * one pill, so the five pills partition the whole set.
 *
 * HONESTY OF THE COUNT: the sheet paginates, so filtering only what has loaded
 * would under-report. While a region is selected the sheet DRAINS the remaining
 * pages, and the header reads "loading" until it has them all — it never states
 * a number it cannot stand behind.
 */

const SHEET_Z_UNDER_REVIEW = 150;

type RegionKey = 'all' | 'gbi' | 'usa' | 'europe' | 'rest';

/** The coarse buckets each named pill owns. Everything else falls to 'rest'. */
const REGION_BUCKETS: Record<Exclude<RegionKey, 'all' | 'rest'>, string[]> = {
  gbi: ['britain & ireland', 'britain and ireland', 'gb&i'],
  usa: ['usa', 'united states', 'united states of america'],
  europe: ['continental europe', 'europe'],
};

function regionOf(r: LatestReview): Exclude<RegionKey, 'all'> {
  const bucket = String(r.courseCountry ?? '').trim().toLowerCase();
  for (const key of ['gbi', 'usa', 'europe'] as const) {
    if (REGION_BUCKETS[key].includes(bucket)) return key;
  }
  return 'rest';
}

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
  const [region, setRegion] = useState<RegionKey>('all');

  const pills: Array<{ key: RegionKey; label: string }> = [
    { key: 'all', label: t('discover.reviews.region.all', 'Worldwide') },
    { key: 'gbi', label: t('discover.reviews.region.gbi', 'GB&I') },
    { key: 'usa', label: t('discover.reviews.region.usa', 'USA') },
    { key: 'europe', label: t('discover.reviews.region.europe', 'Europe') },
    { key: 'rest', label: t('discover.reviews.region.rest', 'Rest of the world') },
  ];
  const activeLabel = pills.find((p) => p.key === region)?.label ?? pills[0].label;

  const visible = useMemo(
    () => (region === 'all' ? reviews : reviews.filter((r) => regionOf(r) === region)),
    [reviews, region],
  );

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

  // FILTERED = DRAIN. A filtered view over a partial set would show "3 reviews"
  // when there are thirty, and an empty region that simply has not loaded yet
  // is indistinguishable from one with nothing in it.
  useEffect(() => {
    if (!open || region === 'all') return;
    if (!hasNextPage || isFetchingNextPage || !onLoadMore) return;
    onLoadMore();
  }, [open, region, hasNextPage, isFetchingNextPage, onLoadMore]);

  const complete = !hasNextPage;
  const total = region === 'all' ? totalCount ?? reviews.length : visible.length;
  const caption =
    region === 'all' || complete
      ? t('discover.reviews.sheetRegionCaption', {
          defaultValue: '{{region}} — {{count}} reviews',
          region: activeLabel,
          count: total,
        })
      : t('discover.reviews.sheetRegionLoading', {
          defaultValue: '{{region}} — loading reviews',
          region: activeLabel,
        });


  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-reviews-title"
      variant="light"
      surfaceColor={A.CANVAS}
      zIndexBase={SHEET_Z_UNDER_REVIEW}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 0 10px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div style={{ padding: '0 16px' }}>
          <div style={{ ...KICKER, color: A.DIM, marginBottom: 5, ...FIGS }}>{caption}</div>
          <div
            id="courseled-reviews-title"
            style={{
              ...TITLE_METRICS,
              color: A.INK,
            }}
          >
            {t('discover.latestReviews', 'Latest reviews')}
          </div>
        </div>

        {/* REGION PILLS — five pills that partition every review. An empty
            region KEEPS its pill: hiding it would change the control's shape as
            data arrives. */}
        <div
          role="tablist"
          aria-label={t('discover.reviews.region.aria', 'Filter reviews by region')}
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '0 16px',
            scrollbarWidth: 'none',
          }}
        >
          {pills.map((p) => {
            const on = p.key === region;
            return (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setRegion(p.key)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 700,
                  fontFamily: SANS,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: on ? A.INK : A.PANEL,
                  color: on ? A.PANEL : A.BODY,
                  border: on ? '1px solid transparent' : `1px solid ${A.BORDER}`,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {visible.length === 0 && complete ? (
          <div style={{ padding: '28px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: A.INK, letterSpacing: '-0.02em' }}>
              {t('discover.reviews.region.emptyTitle', {
                defaultValue: 'No reviews from {{region}} yet',
                region: activeLabel,
              })}
            </div>
            <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 500, color: A.MUTE }}>
              {t(
                'discover.reviews.region.emptyBody',
                'Rate a course there and yours will be the first.',
              )}
            </div>
          </div>
        ) : (
          /* THE SHEET TIERS TOO (§6.2), with ONE departure: a featured review
             renders in the BARS treatment here. The full-width lead is a
             SECTION device — inside a two-column sheet of dozens of tiles a
             recurring full-bleed tile would break the scan, and a quote on
             every other tile stops being a reward. Compact still applies, so
             the sheet keeps the same rhythm the section has. */
          /* COLUMN-FLOW MASONRY, NOT A CSS GRID (BRIEF_REVIEWS_SHEET_MASONRY).
             A grid lays out in ROWS and every row is as tall as its tallest
             item, so a compact tile beside a bars tile left dead space beneath
             it. splitMasonry places each tile in whichever column is currently
             shorter — the same helper Standout Rounds and Personal Bests use.
             The masonry PLACES, it does not re-rank. */
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {reviewColumns.map((col, ci) => (
              <div
                key={ci}
                style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {col.map((r) => {
                  const st = reactions.stateFor('review', r.reviewId);
                  const own = !!viewerId && r.userId === viewerId;
                  return (
                    <ReviewTile
                      key={r.reviewId}
                      review={r}
                      isOwn={own}
                      autoplayGroup="reviews-sheet"
                      tier={reviewTier(r) === 'compact' ? 'compact' : 'bars'}
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
            ))}
          </div>

        )}

        <div ref={sentinel} aria-hidden style={{ height: 24 }} />
      </div>

    </BottomSheet>
  );
}

export default LatestReviewsSheet;
