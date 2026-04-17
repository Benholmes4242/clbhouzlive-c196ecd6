import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ReviewMediaStrip, ReviewMediaItem } from './ReviewMediaStrip';

function getTierLabel(v: number): string {
  if (v >= 9) return 'Outstanding';
  if (v >= 8) return 'Excellent';
  if (v >= 7) return 'Very Good';
  if (v >= 6) return 'Good';
  return 'Fair';
}

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
  onMediaClick?: (index: number) => void;
  onUserClick?: () => void;
  onEditClick?: () => void;
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

/** Circular SVG score ring — matches PDF spec */
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 46 }) => {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const fill = circ * (Math.max(0, Math.min(10, score)) / 10);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F7931E"
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
        {score.toFixed(1)}
      </div>
    </div>
  );
};

const SUBSCORE_LABELS: { key: keyof Review; label: string }[] = [
  { key: 'design_score', label: 'Design' },
  { key: 'condition_score', label: 'Condition' },
  { key: 'clubhouse_score', label: 'Clubhouse' },
  { key: 'facilities_score', label: 'Facilities' },
];

export const ReviewBlockFlat: React.FC<ReviewBlockFlatProps> = ({
  review,
  isMine,
  isHighlighted,
  onToggleHelpful,
  onMediaClick,
  onUserClick,
  onEditClick,
  disabled,
}) => {
  const { user, score, text, createdAt, isHelpful, isUnhelpful, helpfulCount, isMock, media } = review;
  const [showFull, setShowFull] = useState(false);

  const votingDisabled = disabled || isMock || false;

  const subscores = SUBSCORE_LABELS
    .map((s) => ({ label: s.label, value: review[s.key] as number | null | undefined }))
    .filter((s) => s.value !== null && s.value !== undefined);

  const words = text ? text.split(' ') : [];
  const isLong = words.length > 28;
  const truncated = isLong && !showFull ? words.slice(0, 28).join(' ') + '…' : text;

  return (
    <article
      data-review-id={review.id}
      className={cn('transition-all', isHighlighted && 'animate-soft-pulse')}
      style={{ padding: '14px 0 16px' }}
    >
      {/* "Your Review" pin + Edit (only for own review) */}
      {isMine && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <div style={{ width: 3, height: 11, background: '#F7931E', borderRadius: 1 }} />
          <span style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Your Review
          </span>
          <div style={{ flex: 1 }} />
          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ✏️ Edit
            </button>
          )}
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        {onUserClick ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUserClick(); }}
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
          >
            {user.avatarUrl ? (
              <SquircleAvatar src={user.avatarUrl} alt={user.name} size={40} fallback={user.initials} />
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
            <SquircleAvatar src={user.avatarUrl} alt={user.name} size={40} fallback={user.initials} />
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

        <ScoreRing score={score} size={46} />
      </div>

      {/* Sub-scores chips */}
      {subscores.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {subscores.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(15,23,42,0.03)',
                border: '0.5px solid rgba(15,23,42,0.08)',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {Number(s.value).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Review text */}
      {text && text.trim().length > 0 && (
        <>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: '0 0 6px' }}>
            {truncated}
          </p>
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
                marginBottom: 10,
              }}
            >
              {showFull ? 'Show less ↑' : 'Read more ↓'}
            </button>
          )}
        </>
      )}

      {/* Media */}
      {media && media.length > 0 && onMediaClick && (
        <div style={{ marginTop: 4, marginBottom: 10 }}>
          <ReviewMediaStrip media={media} onMediaClick={onMediaClick} variant="compact" />
        </div>
      )}

      {/* Helpful row — only for other reviews */}
      {!isMine && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: '#94A3B8', marginRight: 2 }}>Helpful?</span>
          <button
            type="button"
            onClick={() => !votingDisabled && onToggleHelpful?.(review.id, isHelpful ? 'clear' : 'helpful')}
            disabled={votingDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 8,
              background: isHelpful ? 'rgba(15,23,42,0.06)' : 'transparent',
              border: `1px solid ${isHelpful ? 'rgba(15,23,42,0.12)' : 'rgba(15,23,42,0.07)'}`,
              fontSize: 11,
              fontWeight: isHelpful ? 700 : 500,
              color: isHelpful ? '#0F172A' : '#94A3B8',
              cursor: votingDisabled ? 'default' : 'pointer',
              opacity: votingDisabled ? 0.5 : 1,
            }}
          >
            👍 {helpfulCount}
          </button>
          <button
            type="button"
            onClick={() => !votingDisabled && onToggleHelpful?.(review.id, isUnhelpful ? 'clear' : 'unhelpful')}
            disabled={votingDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 8,
              background: isUnhelpful ? 'rgba(15,23,42,0.06)' : 'transparent',
              border: `1px solid ${isUnhelpful ? 'rgba(15,23,42,0.12)' : 'rgba(15,23,42,0.07)'}`,
              fontSize: 11,
              fontWeight: isUnhelpful ? 700 : 500,
              color: isUnhelpful ? '#0F172A' : '#94A3B8',
              cursor: votingDisabled ? 'default' : 'pointer',
              opacity: votingDisabled ? 0.5 : 1,
            }}
          >
            👎 {review.unhelpfulCount}
          </button>
        </div>
      )}
    </article>
  );
};
