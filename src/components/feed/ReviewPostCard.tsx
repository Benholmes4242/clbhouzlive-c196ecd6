/**
 * ReviewPostCard — the Clubhouse feed's review post (BRIEF_REVIEW_POST_REBUILD,
 * spec reviewcard-spec.html). FeedCard routes review posts here and hands in
 * the media frame and the shared footer as slots, so likes, comments, sharing,
 * the owner menu and the fullscreen viewer keep exactly their existing paths.
 *
 * Every score colour resolves through the app's helpers (R.2): the overall
 * figure and tier word through reviewLabelColor / ReviewVerdictLabel, every
 * category through courseSubScoreTone. Green at 9.0 and above, mute below.
 * A category is never coloured for beating the course average — the tick
 * carries that comparison alone.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { ReviewVerdictLabel, reviewLabelColor } from '@/components/shared/ReviewGhostScore';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { categoryFillPercent } from '@/components/courses/course-detail/CategoryScores';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { buildImageThumbnailUrl } from '@/utils/mediaThumbs';
import { formatRatingValue } from '@/utils/formatters';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { fmtHcp } from '@/lib/whs/format';
import { REVIEW_CARD_MAX_HEIGHT, REVIEW_MEDIA_MIN_HEIGHT, againstCourse, joinClauses } from './reviewPostCard';

const GUTTER = 14;
const BODY_SIZE = 13.5;
const BODY_LINE = 1.5;

type CatKey = 'design' | 'condition' | 'clubhouse' | 'facilities';
const CATS: { key: CatKey; avgKey: 'avg_design_score' | 'avg_condition_score' | 'avg_clubhouse_score' | 'avg_facilities_score' }[] = [
  { key: 'design', avgKey: 'avg_design_score' },
  { key: 'condition', avgKey: 'avg_condition_score' },
  { key: 'clubhouse', avgKey: 'avg_clubhouse_score' },
  { key: 'facilities', avgKey: 'avg_facilities_score' },
];

export interface ReviewPostCardProps {
  post: FeedPost;
  articleRef: React.Ref<HTMLElement>;
  surface: string;
  onProfile: () => void;
  onReadReview: (e: React.MouseEvent) => void;
  onPrefetch: () => void;
  onOpenCourse?: () => void;
  /** Right-hand group of the identity row: the Following pill and the owner menu. */
  identityRight?: React.ReactNode;
  /** F — the media frame's content (single media or carousel), sized to fill. */
  media?: React.ReactNode;
  /** G — the shared footer, unchanged. */
  footer: React.ReactNode;
}

export const ReviewPostCard: React.FC<ReviewPostCardProps> = ({
  post, articleRef, surface, onProfile, onReadReview, onPrefetch, onOpenCourse, identityRight, media, footer,
}) => {
  const { t, i18n } = useTranslation('common');
  const { t: tCourses } = useTranslation('courses');
  const review = post.review!;
  const rating = review.rating;
  const { data: agg } = useCourseRatingAggregates(review.courseId || undefined);

  /* A.1 — the feed row carries ONE privacy-aware index (creator_handicap_index,
     chosen server-side), so there is no eg/manual pair here to hand to
     resolveDisplayHandicap. The clause is dropped when there is no index.
     A.2 — no batched review count exists; the clause is omitted, and
     joinClauses takes it the day a source arrives. */
  const indexClause = post.handicapIndex != null
    ? t('feed.reviewPost.playsOff', { index: fmtHcp(post.handicapIndex) })
    : null;
  const whoLine = joinClauses([indexClause, timeAgo(post.createdAt, { absoluteAfterDays: 30 })]);

  const region = [
    review.courseRegion || review.courseSubCountry || post.courseRegion || post.courseSubCountry,
    review.courseCountry || post.courseCountry,
  ].filter(Boolean).join(', ');

  const against = againstCourse(rating, agg?.avg_overall_score, agg?.review_count);
  const scores: Record<CatKey, number | null> = {
    design: review.breakdown?.design ?? null,
    condition: review.breakdown?.conditions ?? null,
    clubhouse: review.breakdown?.clubhouse ?? null,
    facilities: review.breakdown?.facilities ?? null,
  };
  const anyScore = CATS.some(({ key }) => scores[key] != null);
  const body = review.reviewText || post.caption || '';

  return (
    <article
      ref={articleRef}
      data-review-post-card
      onPointerDown={onPrefetch}
      style={{
        display: 'flex',
        flexDirection: 'column',
        containerType: 'inline-size',
        maxHeight: REVIEW_CARD_MAX_HEIGHT,
        margin: '8px 0',
        background: surface,
        border: `1px solid ${A.BORDER}`,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* A — the reviewer */}
      <div data-review-who style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: `12px ${GUTTER}px 10px` }}>
        <button type="button" onClick={onProfile} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}>
          <SquircleAvatar
            src={buildImageThumbnailUrl(post.avatarUrl, { width: 72 * (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1) })}
            alt={post.displayName}
            userId={post.actorId ?? post.userId}
            size={34}
            hairlineRing
          />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={onProfile}
            style={{
              display: 'block', maxWidth: '100%', background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
              fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK, cursor: 'pointer',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {post.displayName}
          </button>
          <div data-review-who-line style={{ fontSize: 11.5, color: A.DIM, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {whoLine}
          </div>
        </div>
        {identityRight ? <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>{identityRight}</div> : null}
      </div>

      {/* B — the subject and the verdict */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'flex-end', gap: 14, padding: `0 ${GUTTER}px 12px` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: A.DIM }}>
            {t('feed.reviewPost.kicker')}
          </div>
          {onOpenCourse ? (
            <button
              type="button"
              data-review-course
              onClick={(e) => { e.stopPropagation(); onOpenCourse(); }}
              style={{
                display: 'block', maxWidth: '100%', marginTop: 4, padding: 0, background: 'transparent', border: 'none', textAlign: 'left',
                fontSize: 19, fontWeight: 800, letterSpacing: '-0.028em', lineHeight: 1.16, color: A.INK, cursor: 'pointer',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {review.courseName}
            </button>
          ) : (
            <div
              data-review-course
              style={{ marginTop: 4, fontSize: 19, fontWeight: 800, letterSpacing: '-0.028em', lineHeight: 1.16, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {review.courseName}
            </div>
          )}
          {region ? (
            <div style={{ marginTop: 3, fontSize: 12, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region}</div>
          ) : null}
        </div>
        <div style={{ flex: 'none', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div
            data-review-score
            className="tabular-nums"
            style={{ fontSize: 38, fontWeight: 800, lineHeight: 0.88, letterSpacing: '-0.045em', color: reviewLabelColor(rating) }}
          >
            {formatRatingValue(rating)}
          </div>
          <div data-review-tier style={{ marginTop: 4, lineHeight: 1 }}>
            <ReviewVerdictLabel
              rating={rating}
              fontSize={9.5}
              onClick={onReadReview}
              ariaLabel={`${formatRatingValue(rating)} ${getRatingTierLabel(rating)}`}
            />
          </div>
        </div>
      </div>

      {/* C — the context line; absent without an aggregate or on the only review */}
      {against ? (
        <div data-review-against style={{ flex: 'none', padding: `0 ${GUTTER}px 12px`, fontSize: 11.5, lineHeight: 1.4, color: A.MUTE }}>
          {t(`feed.reviewPost.against.${against.direction}`, {
            avg: against.avg.toLocaleString(i18n?.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            count: against.count,
          })}
        </div>
      ) : null}

      {/* D — what they scored. Four columns always; the tick is the course average. */}
      {anyScore ? (
        <ul
          data-review-categories
          style={{ flex: 'none', listStyle: 'none', margin: 0, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 9, padding: `0 ${GUTTER}px 12px` }}
        >
          {CATS.map(({ key, avgKey }) => {
            const value = scores[key];
            const label = tCourses(`review.subscore.${key}`);
            const avg = agg?.[avgKey] ?? null;
            const tone = courseSubScoreTone(value);
            return (
              <li
                key={key}
                data-review-category={key}
                aria-label={value != null ? `${label} ${value.toFixed(1)}` : label}
                style={{ minWidth: 0 }}
              >
                <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {label}
                </div>
                <div data-review-category-value className="tabular-nums" style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2, letterSpacing: '-0.03em', color: value != null ? tone : A.DIM }}>
                  {value != null ? value.toFixed(1) : '\u2014'}
                </div>
                {value != null ? (
                  <div data-review-track style={{ position: 'relative', height: 4, borderRadius: 999, background: A.TRACK, marginTop: 5 }}>
                    <div data-review-fill style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${categoryFillPercent(value)}%`, borderRadius: 999, background: tone }} />
                    {avg != null ? (
                      <div data-review-tick style={{ position: 'absolute', top: -2, left: `${categoryFillPercent(Number(avg))}%`, width: 1.5, height: 8, borderRadius: 1, background: A.MUTE }} />
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* E — the words: two lines, ellipsis, inline Read more. The padding lives
          on this wrapper, never on the clamped box: a -webkit-box with its own
          bottom padding clips below the padding edge and a third line bleeds
          through. The two floats put "Read more" on the last visible line. */}
      {body ? (
        <div data-review-body-wrap style={{ flex: 'none', display: 'flex', padding: `0 ${GUTTER}px 12px` }}>
          <div
            data-review-body
            style={{
              fontSize: BODY_SIZE, lineHeight: BODY_LINE, color: A.INK,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}
          >
            <span aria-hidden style={{ float: 'right', height: `calc(100% - ${BODY_SIZE * BODY_LINE}px)` }} />
            <button
              type="button"
              data-review-read-more
              onClick={(e) => { e.stopPropagation(); onReadReview(e); }}
              style={{
                float: 'right', clear: 'right', marginLeft: 6, padding: 0, background: 'transparent', border: 'none',
                fontSize: BODY_SIZE, lineHeight: BODY_LINE, fontWeight: 800, color: A.INK, cursor: 'pointer',
              }}
            >
              {t('feed.reviewPost.readMore')}
            </button>
            <MentionText text={body} />
          </div>
        </div>
      ) : null}

      {/* F — the media: the ONLY flexible child. Natural size is 1:1, capped at
          the card's width, shrunk to the remaining height, floored at 120. */}
      {media ? (
        <div
          data-review-media
          style={{
            flex: '1 1 auto',
            minHeight: REVIEW_MEDIA_MIN_HEIGHT,
            maxHeight: '100cqw',
            aspectRatio: '1 / 1',
            position: 'relative',
            margin: `0 ${GUTTER}px 12px`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0 }}>{media}</div>
        </div>
      ) : null}

      {/* G — engagement, unchanged objects */}
      <div style={{ flex: 'none' }}>{footer}</div>
    </article>
  );
};
