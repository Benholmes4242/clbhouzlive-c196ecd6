import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatRatingValue } from '@/utils/formatters';
import { bandColorOnDark } from '@/features/courses/_shared/scoreBands';
import { ReviewMediaStrip, ReviewMediaItem } from './ReviewMediaStrip';
import { MentionText } from '@/components/mentions/MentionText';
import { stripMentionMarkup } from '@/lib/mentions/format';

interface Review {
  id: string;
  user: {
    name: string;
    avatarUrl: string | null;
    initials: string;
  };
  score: number;
  text: string;
  createdAt: string;
  helpfulCount: number;
  unhelpfulCount: number;
  isHelpful?: boolean;
  isUnhelpful?: boolean;
  isMock?: boolean;
  design_score?: number | null;
  condition_score?: number | null;
  clubhouse_score?: number | null;
  facilities_score?: number | null;
  media?: ReviewMediaItem[];
  // L6 - tee played (optional). Renders a small outline badge on the meta row.
  teeLabel?: string | null;
}

interface ReviewBlockFlatProps {
  review: Review;
  isMine?: boolean;
  isHighlighted?: boolean;
  onToggleHelpful?: (id: string, value: 'helpful' | 'unhelpful' | 'clear') => void;
  onMediaClick?: (index: number, el: HTMLElement | null) => void;
  onUserClick?: () => void;
  onEditClick?: () => void;
  onReportClick?: () => void;
  disabled?: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  const weeks = Math.floor(diffInDays / 7);
  if (diffInDays < 30) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  const months = Math.floor(diffInDays / 30);
  if (diffInDays < 365) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.floor(diffInDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/** Local formatting helper only — colours themselves always come from
 * bandColorOnDark() in the canonical scoreBands module, never redeclared here. */
const hexToRgba = (color: string, alpha: number): string => {
  if (color.startsWith('rgba') || color.startsWith('rgb(')) return color;
  const hex = color.replace('#', '');
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const SUBSCORE_LABELS: { key: keyof Review; labelKey: string }[] = [
  { key: 'design_score', labelKey: 'review.subscore.design' },
  { key: 'condition_score', labelKey: 'review.subscore.condition' },
  { key: 'clubhouse_score', labelKey: 'review.subscore.clubhouse' },
  { key: 'facilities_score', labelKey: 'review.subscore.facilities' },
];

export const ReviewBlockFlat: React.FC<ReviewBlockFlatProps> = ({
  review,
  isMine,
  isHighlighted,
  onToggleHelpful,
  onMediaClick,
  onUserClick,
  onEditClick,
  onReportClick,
  disabled,
}) => {
  const { t } = useTranslation('courses');
  const { user, score, text, createdAt, isHelpful, isUnhelpful, helpfulCount, isMock, media } = review;
  const [showFull, setShowFull] = useState(false);

  const votingDisabled = disabled || isMock || false;

  const subscores = SUBSCORE_LABELS
    .map((s) => ({ label: t(s.labelKey), value: review[s.key] as number | null | undefined }))
    .filter((s) => s.value !== null && s.value !== undefined);

  const strippedText = text ? stripMentionMarkup(text) : '';
  const strippedWords = strippedText ? strippedText.split(' ') : [];
  const isLong = strippedWords.length > 28;
  const collapsedText = isLong && !showFull ? strippedWords.slice(0, 28).join(' ') + '…' : null;

  return (
    <article
      data-review-id={review.id}
      className={cn('transition-all', isHighlighted && 'animate-soft-pulse')}
      style={{ padding: '12px 0 16px' }}
    >
      {/* "YOUR REVIEW" section header + Edit (only for own review) */}
      {isMine && (
        <SectionHeader
          role="section"
          kicker="YOUR REVIEW"
          action={onEditClick ? { label: 'Edit', onClick: onEditClick } : undefined}
          className="mb-3"
        />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        {onUserClick ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUserClick(); }}
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
          >
            {user.avatarUrl ? (
              <SquircleAvatar src={user.avatarUrl} alt={user.name} size={40} hairlineRing ringColor={DARK_HAIRLINE} />

            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                {user.initials}
              </div>
            )}
          </button>
        ) : (
          user.avatarUrl ? (
            <SquircleAvatar src={user.avatarUrl} alt={user.name} size={40} hairlineRing ringColor={DARK_HAIRLINE} />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user.initials}
            </div>
          )
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.96)', lineHeight: 1.3 }}>{user.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)' }}>{formatDate(createdAt)}</span>
            {review.teeLabel && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '1px 7px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.10)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.62)',
                  textTransform: 'none',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('review.teeBadge', { label: review.teeLabel, defaultValue: '{{label}} tees' })}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums lining-nums',
              color: bandColorOnDark(score),
            }}
          >
            {formatRatingValue(score)}
          </span>
          {!isMine && onReportClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReportClick();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.62)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={t('review.reportA11y', { defaultValue: 'Report review' })}
            >
              <MoreHorizontal size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Sub-scores chips */}
      {subscores.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {subscores.map((s) => {
            const chipColor = bandColorOnDark(Number(s.value));
            return (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 9px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${hexToRgba(chipColor, 0.35)}`,
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 700, color: chipColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: chipColor, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  {formatRatingValue(Number(s.value))}
                </span>
              </div>
            );
          })}
        </div>
      )}


      {/* Review text */}
      {text && text.trim().length > 0 && (
        <>
          {collapsedText !== null ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.65, margin: '0 0 6px' }}>
              {collapsedText}
            </p>
          ) : (
            <MentionText
              as="p"
              text={text}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.65, margin: '0 0 6px' }}
            />
          )}
          {isLong && (
            <button
              type="button"
              onClick={() => setShowFull(!showFull)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.62)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                marginBottom: 12,
              }}
            >
              {showFull ? 'Show less ↑' : 'Read more ↓'}
            </button>
          )}
        </>
      )}

      {/* Media */}
      {media && media.length > 0 && onMediaClick && (
        <div style={{ marginBottom: 12 }}>
          <ReviewMediaStrip media={media} onMediaClick={onMediaClick} variant="compact" />
        </div>
      )}

      {/* Helpful row — only for other reviews */}
      {!isMine && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)', marginRight: 2 }}>{t('review.helpful')}</span>
          <button
            type="button"
            onClick={() => !votingDisabled && onToggleHelpful?.(review.id, isHelpful ? 'clear' : 'helpful')}
            disabled={votingDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: isHelpful ? '5px 10px' : '4px 8px',
              borderRadius: 8,
              background: isHelpful ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: isHelpful
                ? '1px solid rgba(255,255,255,0.10)'
                : '0.5px solid rgba(255,255,255,0.10)',
              fontSize: 11,
              fontWeight: isHelpful ? 700 : 500,
              color: isHelpful ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.62)',
              cursor: votingDisabled ? 'default' : 'pointer',
              opacity: votingDisabled ? 0.5 : 1,
            }}
          >
            <ThumbsUp size={13} strokeWidth={2} />{helpfulCount > 0 && <span>{helpfulCount}</span>}
          </button>
          <button
            type="button"
            onClick={() => !votingDisabled && onToggleHelpful?.(review.id, isUnhelpful ? 'clear' : 'unhelpful')}
            disabled={votingDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: isUnhelpful ? '5px 10px' : '4px 8px',
              borderRadius: 8,
              background: isUnhelpful ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: isUnhelpful
                ? '1px solid rgba(255,255,255,0.10)'
                : '0.5px solid rgba(255,255,255,0.10)',
              fontSize: 11,
              fontWeight: isUnhelpful ? 700 : 500,
              color: isUnhelpful ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.62)',
              cursor: votingDisabled ? 'default' : 'pointer',
              opacity: votingDisabled ? 0.5 : 1,
            }}
          >
            <ThumbsDown size={13} strokeWidth={2} />{review.unhelpfulCount > 0 && <span>{review.unhelpfulCount}</span>}
          </button>
        </div>
      )}
    </article>
  );
};
