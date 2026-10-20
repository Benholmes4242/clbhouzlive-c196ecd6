/**
 * ReviewPostCard — the Clubhouse feed's review post (BRIEF_REVIEW_POST_V2,
 * spec reviewpost-v2.html). A REVIEW POST IS NOT A CARD: the article takes
 * FeedCard's own frame — edge to edge, no border, no radius, a 1px hairline
 * above unless it is the first post. FeedCard hands in the media and the
 * shared footer as slots, so likes, comments, sharing, the owner menu and
 * the fullscreen viewer keep exactly their existing paths.
 *
 * Every score colour resolves through the app's helpers: the overall figure
 * and tier word through reviewLabelColor / ReviewVerdictLabel, every category
 * through courseSubScoreTone. Green at 9.0 and above, mute below.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FeedPost } from '@/components/media-system/types/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { ReviewVerdictLabel, reviewLabelColor } from '@/components/shared/ReviewGhostScore';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { CategoryScores } from '@/components/courses/course-detail/CategoryScores';
import { formatRatingValue } from '@/utils/formatters';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { formatRelativeWithSeconds as timeAgo } from '@/i18n/format';
import { CARD, LINE, T100, T60, T40 } from './feedTokens';
import { REVIEW_CARD_MAX_HEIGHT, REVIEW_MEDIA_MIN_HEIGHT, REVIEW_BODY_CLAMP, REVIEW_COURSE_CLAMP } from './reviewPostCard';

const GUTTER = 14;
const NAME_SIZE = 15;
const NAME_LINE = 1.25;


const COURSE_NAME_STYLE: React.CSSProperties = {
  fontSize: 19, fontWeight: 800, letterSpacing: '-0.028em', lineHeight: 1.16, color: A.INK,
  ...REVIEW_COURSE_CLAMP,
};

export interface ReviewPostCardProps {
  post: FeedPost;
  articleRef: React.Ref<HTMLElement>;
  /** FeedCard's feedIndex: no hairline on the first post, same rule as a round. */
  feedIndex?: number;
  onProfile: () => void;
  onReadReview: (e: React.MouseEvent) => void;
  onPrefetch: () => void;
  onOpenCourse?: () => void;
  /** The same FeedFollowPill a normal post mounts; inline on the meta line after the date. */
  followPill?: React.ReactNode;
  /** The owner menu: inline on the meta line, before the date, as a normal post does. */
  ownerMenu?: React.ReactNode;
  /** F — the media frame's content (single media or carousel), sized to fill. */
  media?: React.ReactNode;
  /** G — the shared footer, unchanged. */
  footer: React.ReactNode;
}

export const ReviewPostCard: React.FC<ReviewPostCardProps> = ({
  post, articleRef, feedIndex, onProfile, onReadReview, onPrefetch, onOpenCourse, followPill, ownerMenu, media, footer,
}) => {
  const { t } = useTranslation('common');
  const { t: tCourses } = useTranslation('courses');
  /* ONE HOME: a review whose course did not resolve has no `review` object;
     every part below drops independently. */
  const review = post.review;
  const rating = review?.rating ?? null;

  /* A — the meta line is the date only, exactly like a normal post: the
     handicap-index and courses-reviewed clauses were removed by user decision
     ("just have the date and then following/follow, like the normal post"). */
  const whoLine = timeAgo(post.createdAt, { absoluteAfterDays: 30 });

  const region = [
    review?.courseRegion || review?.courseSubCountry || post.courseRegion || post.courseSubCountry,
    review?.courseCountry || post.courseCountry,
  ].filter(Boolean).join(', ');

  const courseName = review?.courseName || post.courseName || null;
  const scores = {
    design: review?.breakdown?.design ?? null,
    condition: review?.breakdown?.conditions ?? null,
    clubhouse: review?.breakdown?.clubhouse ?? null,
    facilities: review?.breakdown?.facilities ?? null,
  };
  const anyScore = Object.values(scores).some((v) => v != null);
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
        marginInline: 0,
        background: CARD,
        borderTop: feedIndex === 0 ? undefined : `1px solid ${LINE}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* A — the reviewer */}
      <div data-review-who style={{ flex: 'none', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px 2px' }}>
        <button type="button" onClick={onProfile} style={{ display: 'flex', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}>
          <SquircleAvatar
            src={post.avatarUrl}
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
              fontSize: NAME_SIZE, fontWeight: 700, lineHeight: NAME_LINE, color: T100, cursor: 'pointer',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {post.displayName}
          </button>
          {/* A.1 — the meta line reads exactly like a normal post: the owner
              menu, then the date, then the follow pill, all inline. The earlier
              deliberate top-right departure was removed by user decision. */}
          <div data-review-who-line style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
            {ownerMenu}
            <span style={{ fontSize: 12, lineHeight: NAME_LINE, color: T60, whiteSpace: 'nowrap' }}>{whoLine}</span>
            {followPill}
          </div>
        </div>
      </div>

      {/* B — the subject and the verdict */}
      <div data-review-subject style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: `8px ${GUTTER}px 12px` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {!courseName ? null : onOpenCourse ? (
            <button
              type="button"
              data-review-course
              onClick={(e) => { e.stopPropagation(); onOpenCourse(); }}
              style={{ ...COURSE_NAME_STYLE, maxWidth: '100%', padding: 0, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              {courseName}
            </button>
          ) : (
            <div data-review-course style={COURSE_NAME_STYLE}>{courseName}</div>
          )}
          {region ? (
            <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.2, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region}</div>
          ) : null}
        </div>
        {rating != null ? (
        <div data-review-score-col style={{ flex: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            data-review-score
            className="tabular-nums"
            style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: reviewLabelColor(rating) }}
          >
            {formatRatingValue(rating)}
          </div>
          <div data-review-tier style={{ marginTop: 6, lineHeight: 1 }}>
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

      {/* D — what they scored. The shared course-page block (bar, figure,
          label); a missing category keeps its empty column. */}
      {anyScore ? (
        <div data-review-categories style={{ flex: 'none', padding: `0 ${GUTTER}px 12px` }}>
          <CategoryScores scores={scores} />
        </div>
      ) : null}

      {/* E — the words at the caption's size. Padding lives on the wrapper,
          never on the clamped box (a padded -webkit-box bleeds a third line). */}
      {body ? (
        <div data-review-body-wrap style={{ flex: 'none', display: 'flex', padding: `0 ${GUTTER}px 6px` }}>
          <div data-review-body style={{ fontSize: 15, lineHeight: 1.4, color: A.INK, ...REVIEW_BODY_CLAMP }}>
            <MentionText text={body} />
          </div>
        </div>
      ) : null}

      {/* E.2 — the one way into the full review, present in both states. */}
      <button
        type="button"
        data-review-cta
        onClick={(e) => { e.stopPropagation(); onReadReview(e); }}
        style={{
          flex: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: `0 ${GUTTER}px 12px`,
          background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: A.INK,
        }}
      >
        {t('feed.reviewPost.readFullReview')}
        <span aria-hidden style={{ color: T40 }}>{'\u203A'}</span>
      </button>

      {/* F — the media, edge to edge: the ONLY flexible child. 1:1, capped at
          the post's width, shrunk to the remaining height, floored at 120. */}
      {media ? (
        <div
          data-review-media
          style={{
            flex: '1 1 auto',
            minHeight: REVIEW_MEDIA_MIN_HEIGHT,
            maxHeight: '100cqw',
            aspectRatio: '1 / 1',
            position: 'relative',
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
