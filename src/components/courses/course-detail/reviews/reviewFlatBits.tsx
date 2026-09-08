/**
 * BRIEF_REVIEWS_TAB_REBUILD §4 — THE REVIEW ROW.
 *
 * No Panel, no card, no border, no background. The prose is the content (87% of
 * reviews carry it), so nothing else on the row is allowed to shout over it:
 * the four outlined amber category pills become ONE quiet mid-dot line, and a
 * figure of 9.0+ takes the analytical GREEN — the one place that colour earns
 * its keep, marking the standout score in a line of eights.
 *
 * PHOTO STRIP: the shared `ReviewMediaStrip` is deliberately NOT used here and
 * NOT modified. It renders fixed 70px squares at radius 9 / 5px gap; the brief
 * asks for up to four equal-width tiles, 66px tall, radius 8, 6px gap. The
 * strip keeps its other consumers unchanged and the fullscreen viewer is
 * entered through the SAME `onMediaClick(index, el)` contract, so tapping a
 * tile still opens the canonical viewer.
 *
 * HELPFUL: a single affirmative. All 99 votes ever cast are `helpful` — there
 * has never been an unhelpful vote — so the thumbs-down is gone and the
 * mutation is called only with 'helpful' | 'clear'.
 */
import React, { useState } from 'react';
import { Heart, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { bandColorOnDark } from '@/features/courses/_shared/scoreBands';
import { formatRatingValue } from '@/utils/formatters';
import { MentionText } from '@/components/mentions/MentionText';
import { stripMentionMarkup } from '@/lib/mentions/format';
import type { CourseReview } from '@/hooks/useCourseReviews';

const getInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const formatReviewDate = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffInDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffInDays <= 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(diffInDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/** §4b — the four category figures as one quiet mid-dot line. */
const CATEGORY_KEYS: { key: keyof CourseReview; label: string }[] = [
  { key: 'design_score', label: 'Design' },
  { key: 'condition_score', label: 'Condition' },
  { key: 'clubhouse_score', label: 'Clubhouse' },
  { key: 'facilities_score', label: 'Facilities' },
];

const CategoryLine: React.FC<{ review: CourseReview }> = ({ review }) => {
  const items = CATEGORY_KEYS
    .map((c) => ({ label: c.label, value: review[c.key] as number | null | undefined }))
    .filter((c) => c.value !== null && c.value !== undefined);
  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: 6,
        fontSize: 11,
        color: A.DIM,
        marginTop: 8,
      }}
    >
      {items.map((item, i) => {
        const value = Number(item.value);
        return (
          <React.Fragment key={item.label}>
            {i > 0 && <span aria-hidden="true" style={{ color: A.DIM }}>·</span>}
            <span>
              {item.label}{' '}
              <span style={{ ...FIGS, color: value >= 9 ? A.GREEN : A.MUTE, fontWeight: 700 }}>
                {formatRatingValue(value)}
              </span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** §4d — up to four equal-width tiles, 66px tall. Same viewer contract. */
const PhotoStrip: React.FC<{
  review: CourseReview;
  onMediaClick: (index: number, el: HTMLElement | null) => void;
}> = ({ review, onMediaClick }) => {
  const media = (review.media ?? []).slice(0, 4);
  if (media.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
      {media.map((item, index) => {
        const src = item.media_type === 'video' ? (item.poster_url || item.media_url) : item.media_url;
        return (
          <PhotoTile key={item.id} src={src} index={index} onMediaClick={onMediaClick} />
        );
      })}
    </div>
  );
};

const PhotoTile: React.FC<{
  src: string;
  index: number;
  onMediaClick: (index: number, el: HTMLElement | null) => void;
}> = ({ src, index, onMediaClick }) => {
  const ref = React.useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onMediaClick(index, ref.current)}
      style={{
        flex: 1,
        minWidth: 0,
        height: 66,
        borderRadius: 8,
        overflow: 'hidden',
        border: 'none',
        padding: 0,
        background: A.TRACK,
        cursor: 'pointer',
      }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </button>
  );
};

export interface FlatReviewRowProps {
  review: CourseReview;
  /** Own review: name reads "You", name and score in AMBER. */
  isMine?: boolean;
  displayName: string;
  avatarUrl: string | null;
  /** Viewer has voted this review helpful. */
  isHelpful?: boolean;
  votingDisabled?: boolean;
  onToggleHelpful?: (id: string, action: 'helpful' | 'clear') => void;
  onMediaClick: (index: number, el: HTMLElement | null) => void;
  onUserClick?: () => void;
  onOverflow?: () => void;
  onReadMore?: (expanded: boolean) => void;
  isHighlighted?: boolean;
}

export const FlatReviewRow: React.FC<FlatReviewRowProps> = ({
  review,
  isMine,
  displayName,
  avatarUrl,
  isHelpful,
  votingDisabled,
  onToggleHelpful,
  onMediaClick,
  onUserClick,
  onOverflow,
  onReadMore,
  isHighlighted,
}) => {
  const [expanded, setExpanded] = useState(false);
  const name = isMine ? 'You' : displayName;
  const score = review.rating ?? 0;
  const scoreColor = isMine ? A.AMBER : bandColorOnDark(score);
  const helpfulCount = review.helpful_count ?? 0;

  const stripped = review.review ? stripMentionMarkup(review.review) : '';
  const words = stripped ? stripped.split(' ') : [];
  const isLong = words.length > 28;
  const collapsed = isLong && !expanded ? `${words.slice(0, 28).join(' ')}…` : null;

  return (
    <article
      data-review-id={review.id}
      className={isHighlighted ? 'animate-soft-pulse' : undefined}
      style={{ fontFamily: SANS, padding: '14px 0 16px' }}
    >
      {/* a) avatar, name, date, score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onUserClick && !isMine ? (
          <button
            type="button"
            onClick={onUserClick}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
          >
            <SquircleAvatar src={avatarUrl} alt={name} userId={review.user_id} fallback={getInitials(displayName)} size={36} hairlineRing ringColor={DARK_HAIRLINE} />
          </button>
        ) : (
          <SquircleAvatar src={avatarUrl} alt={name} userId={review.user_id} fallback={getInitials(displayName)} size={36} hairlineRing ringColor={DARK_HAIRLINE} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: isMine ? A.AMBER : A.INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 11, color: A.DIM, marginTop: 2 }}>
            {formatReviewDate(review.review_date)}
          </div>
        </div>

        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: scoreColor, ...FIGS }}>
          {formatRatingValue(score)}
        </span>
      </div>

      {/* b) the quiet category line */}
      <CategoryLine review={review} />

      {/* c) the prose */}
      {review.review && review.review.trim().length > 0 && (
        <>
          {collapsed !== null ? (
            <p style={{ fontSize: 13, color: A.MUTE, lineHeight: 1.6, margin: '10px 0 0' }}>{collapsed}</p>
          ) : (
            <MentionText
              as="p"
              text={review.review}
              style={{ fontSize: 13, color: A.MUTE, lineHeight: 1.6, margin: '10px 0 0' }}
            />
          )}
          {isLong && (
            <button
              type="button"
              onClick={() => {
                const next = !expanded;
                setExpanded(next);
                onReadMore?.(next);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                marginTop: 6,
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 12,
                fontWeight: 600,
                color: A.MUTE,
                cursor: 'pointer',
              }}
            >
              {expanded ? 'Show less' : 'Read more'}
              {expanded ? <ChevronUp size={13} strokeWidth={2} /> : <ChevronDown size={13} strokeWidth={2} />}
            </button>
          )}
        </>
      )}

      {/* d) photos */}
      <PhotoStrip review={review} onMediaClick={onMediaClick} />

      {/* e) the foot row: one Helpful control, overflow right */}
      {!isMine && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
          <button
            type="button"
            disabled={votingDisabled}
            onClick={() => !votingDisabled && onToggleHelpful?.(review.id, isHelpful ? 'clear' : 'helpful')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 11,
              fontWeight: isHelpful ? 700 : 500,
              color: isHelpful ? A.INK : A.DIM,
              cursor: votingDisabled ? 'default' : 'pointer',
              opacity: votingDisabled ? 0.5 : 1,
            }}
            aria-pressed={!!isHelpful}
          >
            <Heart size={13} strokeWidth={2} fill={isHelpful ? A.INK : 'none'} />
            {helpfulCount > 0 && <span style={FIGS}>{helpfulCount}</span>}
            <span>Helpful</span>
          </button>

          {onOverflow && (
            <button
              type="button"
              onClick={onOverflow}
              aria-label="More"
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                padding: 2,
                color: A.DIM,
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      )}
    </article>
  );
};

/** A flat text action with a right chevron — navigation only. */
export const FlatAction: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'none',
      border: 'none',
      padding: '14px 0 0',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.19em',
      textTransform: 'uppercase',
      color: A.INK,
      fontFamily: SANS,
      cursor: 'pointer',
    }}
  >
    {label} <span aria-hidden="true">›</span>
  </button>
);
