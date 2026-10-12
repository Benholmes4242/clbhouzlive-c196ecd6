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
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { ReviewVerdictLabel, reviewLabelColor } from '@/components/shared/ReviewGhostScore';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { categoryFillPercent } from '@/components/courses/course-detail/CategoryScores';
import { buildImageThumbnailUrl } from '@/utils/mediaThumbs';
import { formatRatingValue } from '@/utils/formatters';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { fmtHcp } from '@/lib/whs/format';
import { REVIEW_CARD_MAX_HEIGHT, REVIEW_MEDIA_MIN_HEIGHT, REVIEW_BODY_CLAMP, againstCourse, joinClauses } from './reviewPostCard';

const GUTTER = 14;
const BODY_SIZE = 13.5;
const BODY_LINE = 1.5;

type CatKey = 'design' | 'condition' | 'clubhouse' | 'facilities';
const CATS: CatKey[] = ['design', 'condition', 'clubhouse', 'facilities'];

export interface ReviewPostCardProps {
  post: FeedPost;
  articleRef: React.Ref<HTMLElement>;
  surface: string;
  onProfile: () => void;
  onReadReview: (e: React.MouseEvent) => void;
  onPrefetch: () => void;
  /** The member's courses-rated figure (useReviewerStats, already read by FeedCard). */
  coursesReviewed?: number | null;
  onOpenCourse?: () => void;
  /** Right-hand group of the identity row: the Following pill and the owner menu. */
  identityRight?: React.ReactNode;
  /** F — the media frame's content (single media or carousel), sized to fill. */
  media?: React.ReactNode;
  /** G — the shared footer, unchanged. */
  footer: React.ReactNode;
}

export const ReviewPostCard: React.FC<ReviewPostCardProps> = ({
  post, articleRef, surface, onProfile, onReadReview, onPrefetch, coursesReviewed = null, onOpenCourse, identityRight, media, footer,
}) => {
  const { t, i18n } = useTranslation('common');
  const { t: tCourses } = useTranslation('courses');
  /* ONE HOME: a review whose course did not resolve has no `review` object;
     every part below drops independently, like a missing region. */
  const review = post.review;
  const rating = review?.rating ?? null;

  /* A.1 — the feed row carries ONE privacy-aware index (creator_handicap_index,
     chosen server-side), so there is no eg/manual pair here to hand to
     resolveDisplayHandicap. The clause is dropped when there is no index.
     A.2 — the count comes from useReviewerStats, which FeedCard already reads
     for every review card. It is LATCHED: the line composes once with what had
     arrived by first paint, so a late count never shifts the date along under
     the reader's eye (same pattern as leadSettledOnce). */
  const indexClause = post.handicapIndex != null
    ? t('feed.reviewPost.playsOff', { index: fmtHcp(post.handicapIndex) })
    : null;
  const countAtFirstPaint = useRef<number | null | undefined>(undefined);
  if (countAtFirstPaint.current === undefined) countAtFirstPaint.current = coursesReviewed;
  const latchedCount = countAtFirstPaint.current;
  const countClause = latchedCount != null && latchedCount > 0
    ? t('feed.reviewPost.coursesReviewed', { count: latchedCount })
    : null;
  const whoLine = joinClauses([indexClause, countClause, timeAgo(post.createdAt, { absoluteAfterDays: 30 })]);

  const region = [
    review?.courseRegion || review?.courseSubCountry || post.courseRegion || post.courseSubCountry,
    review?.courseCountry || post.courseCountry,
  ].filter(Boolean).join(', ');

  /* C — the batched course average (feed row course_avg_overall_score). No
     batched review count exists, so the line states the average alone. */
  const against = againstCourse(rating, post.courseRating ?? null);
  const courseName = review?.courseName || post.courseName || null;
  const scores: Record<CatKey, number | null> = {
    design: review?.breakdown?.design ?? null,
    condition: review?.breakdown?.conditions ?? null,
    clubhouse: review?.breakdown?.clubhouse ?? null,
    facilities: review?.breakdown?.facilities ?? null,
  };
  const anyScore = CATS.some((key) => scores[key] != null);
  const body = review?.reviewText || post.caption || '';

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
        <button type="button" onClick={onProfile} style={{ display: 'flex', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}>
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
              fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, color: A.INK, cursor: 'pointer',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {post.displayName}
          </button>
          <div data-review-who-line style={{ fontSize: 11.5, lineHeight: 1.2, color: A.DIM, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {whoLine}
          </div>
        </div>
        {identityRight ? <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>{identityRight}</div> : null}
      </div>

      {/* B — the subject and the verdict */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'flex-end', gap: 14, padding: `0 ${GUTTER}px 12px` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, lineHeight: 1.2, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: A.DIM }}>
            {t('feed.reviewPost.kicker')}
          </div>
          {!courseName ? null : onOpenCourse ? (
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
              {courseName}
            </button>
          ) : (
            <div
              data-review-course
              style={{ marginTop: 4, fontSize: 19, fontWeight: 800, letterSpacing: '-0.028em', lineHeight: 1.16, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {courseName}
            </div>
          )}
          {region ? (
            <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.2, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region}</div>
          ) : null}
        </div>
        {rating != null ? (
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
        ) : null}
      </div>

      {/* C — the context line; absent without an aggregate or on the only review.
          Reads post.courseRating, mapped by feedMapper from course_avg_overall_score.
          Four callers map rows into this card: useSuggestedFeed (Clubhouse,
          get_suggested_feed_v3) PROJECTS the field; useProfilePosts (posts tab,
          get_profile_posts), useCourseMedia and useGalleryCourseMedia (both
          get_course_media_v2) do NOT, per the repo's generated types. On those
          surfaces the line is absent, never wrong. Do not add a per-card read to
          close the gap; it is a projection change on those reads (Ben's call).
          Row is 22.7px: 16.7px of line + 6px under. */}
      {against ? (
        <div data-review-against style={{ flex: 'none', padding: `0 ${GUTTER}px 6px`, fontSize: 11.5, lineHeight: 1.45, color: A.MUTE }}>
          {t(`feed.reviewPost.against.${against.direction}`, {
            avg: against.avg.toLocaleString(i18n?.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          })}
        </div>
      ) : null}

      {/* D — what they scored. Four columns always. No course-average tick:
          the category averages are not in the batched feed read, and a
          per-card read is not allowed. It returns once they are batched. */}
      {anyScore ? (
        <ul
          data-review-categories
          style={{ flex: 'none', listStyle: 'none', margin: 0, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 9, padding: `0 ${GUTTER}px 12px` }}
        >
          {CATS.map((key) => {
            const value = scores[key];
            const label = tCourses(`review.subscore.${key}`);
            const tone = courseSubScoreTone(value);
            return (
              <li
                key={key}
                data-review-category={key}
                aria-label={value != null ? `${label} ${value.toFixed(1)}` : label}
                style={{ minWidth: 0 }}
              >
                <div style={{ fontSize: 8.5, lineHeight: 1.2, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {label}
                </div>
                <div data-review-category-value className="tabular-nums" style={{ fontSize: 16.5, lineHeight: 1.15, fontWeight: 800, marginTop: 2, letterSpacing: '-0.03em', color: value != null ? tone : A.DIM }}>
                  {value != null ? value.toFixed(1) : '\u2014'}
                </div>
                {value != null ? (
                  <div data-review-track style={{ position: 'relative', height: 4, borderRadius: 999, background: A.BORDER, marginTop: 5 }}>
                    <div data-review-fill style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${categoryFillPercent(value)}%`, borderRadius: 999, background: tone }} />
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
              ...REVIEW_BODY_CLAMP,
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
            margin: `0 ${GUTTER}px 8px`,
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
