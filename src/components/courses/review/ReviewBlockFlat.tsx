import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatRatingValue } from '@/utils/formatters';
import { getScoreRingColors } from '@/hooks/useTierStyles';
import { getRatingTier } from '@/lib/ratingTier';
import { ReviewMediaStrip, ReviewMediaItem } from './ReviewMediaStrip';
import { MentionText } from '@/components/mentions/MentionText';
import { stripMentionMarkup } from '@/lib/mentions/format';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/** Circular SVG score ring — graduated grey → amber → gold ramp */
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 46 }) => {
  const { from, to } = getScoreRingColors(score);
  const isExceptional = getRatingTier(score) === 'EXCEPTIONAL';
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const fill = circ * (Math.max(0, Math.min(10, score)) / 10);
  const gradientId = `scoreGradient-${Math.random().toString(36).slice(2)}`;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
            {isExceptional && !prefersReducedMotion && (
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                from="0 0.5 0.5"
                to="360 0.5 0.5"
                dur="6s"
                repeatCount="indefinite"
              />
            )}
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 900,
          color: '#0F172A',
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatRatingValue(score)}
      </div>
    </div>
  );
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
              <SquircleAvatar src={user.avatarUrl} alt={user.name} size={40} hairlineRing ringColor={LIGHT_HAIRLINE} />

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
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                }}
              >
                {user.initials}
              </div>
            )}
          </button>
        ) : (
          user.avatarUrl ? (
            <SquircleAvatar src={user.avatarUrl} alt={user.name} size={40} hairlineRing ringColor={LIGHT_HAIRLINE} />
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
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {user.initials}
            </div>
          )
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{formatDate(createdAt)}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <ScoreRing score={score} size={46} />
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
                color: '#94A3B8',
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
          {subscores.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 999,
                background: 'rgba(247,147,30,0.08)',
                border: '1px solid rgba(247,147,30,0.2)',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: '#F7931E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#F7931E', fontVariantNumeric: 'tabular-nums' }}>
                {formatRatingValue(Number(s.value))}
              </span>
            </div>
          ))}
        </div>
      )}


      {/* Review text */}
      {text && text.trim().length > 0 && (
        <>
          {collapsedText !== null ? (
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: '0 0 6px' }}>
              {collapsedText}
            </p>
          ) : (
            <MentionText
              as="p"
              text={text}
              style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: '0 0 6px' }}
            />
          )}
          {isLong && (
            <button
              type="button"
              onClick={() => setShowFull(!showFull)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
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
          <span style={{ fontSize: 11, color: '#94A3B8', marginRight: 2 }}>{t('review.helpful')}</span>
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
              background: isHelpful ? 'rgba(15,23,42,0.06)' : 'transparent',
              border: isHelpful
                ? '1px solid rgba(15,23,42,0.12)'
                : '0.5px solid rgba(15,23,42,0.05)',
              fontSize: 11,
              fontWeight: isHelpful ? 700 : 500,
              color: isHelpful ? '#0F172A' : '#94A3B8',
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
              background: isUnhelpful ? 'rgba(15,23,42,0.06)' : 'transparent',
              border: isUnhelpful
                ? '1px solid rgba(15,23,42,0.12)'
                : '0.5px solid rgba(15,23,42,0.05)',
              fontSize: 11,
              fontWeight: isUnhelpful ? 700 : 500,
              color: isUnhelpful ? '#0F172A' : '#94A3B8',
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
