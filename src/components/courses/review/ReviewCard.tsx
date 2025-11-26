import React, { useState } from 'react';
import { clsx } from 'clsx';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import SquircleImage from '@/components/ui/SquircleImage';

// Get rating variant from score
export const getRatingVariant = (score: number): 'fair' | 'good' | 'veryGood' | 'excellent' | 'outstanding' => {
  if (score >= 9.0) return 'outstanding';
  if (score >= 8.0) return 'excellent';
  if (score >= 7.0) return 'veryGood';
  if (score >= 6.0) return 'good';
  return 'fair';
};

// Badge color mapping - using hex codes
const RATING_CHIP_COLORS = {
  fair: { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },        // slate-50/slate-500/slate-200
  good: { bg: '#eff6ff', text: '#3b82f6', border: '#dbeafe' },        // blue-50/blue-500/blue-100
  veryGood: { bg: '#d1fae5', text: '#10b981', border: '#a7f3d0' },    // emerald-100/emerald-500/emerald-200
  excellent: { bg: '#dcfce7', text: '#22c55e', border: '#bbf7d0' },   // green-100/green-500/green-200
  outstanding: { bg: '#fef3c7', text: '#f59e0b', border: '#fde68a' }, // amber-100/amber-500/amber-200
};

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
}

interface ReviewCardProps {
  review: Review;
  isMine?: boolean;
  isHighlighted?: boolean;
  onToggleHelpful?: (id: string, value: 'helpful' | 'unhelpful' | 'clear') => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

const RatingChip: React.FC<{ score: number }> = ({ score }) => {
  const variant = getRatingVariant(score);
  const colors = RATING_CHIP_COLORS[variant];

  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {score.toFixed(1)} /10
    </span>
  );
};

const ReviewText: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = text.length > 260;

  return (
    <div className="mt-3 text-sm text-slate-800">
      <p className={clsx(!expanded && shouldTruncate && 'line-clamp-4')}>
        {text}
      </p>

      {shouldTruncate && (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

interface HelpfulButtonProps {
  kind: 'helpful' | 'unhelpful';
  isActive?: boolean;
  count: number;
  onClick: () => void;
}

const HelpfulButton: React.FC<HelpfulButtonProps> = ({ kind, isActive, count, onClick }) => {
  const isHelpful = kind === 'helpful';

  const base =
    'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition';

  const activeClasses = isHelpful
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-rose-200 bg-rose-50 text-rose-700';

  const inactiveClasses = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <button
      type="button"
      className={clsx(base, isActive ? activeClasses : inactiveClasses)}
      onClick={onClick}
    >
      <span>{isHelpful ? '👍' : '👎'}</span>
      <span>{isHelpful ? 'Helpful' : 'Unhelpful'}</span>
      <span>({count})</span>
    </button>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isMine,
  isHighlighted,
  onToggleHelpful,
}) => {
  const { user, score, text, createdAt, isHelpful, isUnhelpful, helpfulCount, unhelpfulCount } =
    review;

  return (
    <article
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white px-4 py-3',
        'shadow-sm',
        isHighlighted && 'animate-soft-pulse'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <SquircleImage
              src={user.avatarUrl}
              alt={user.name}
              size={40}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
              {user.initials}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              {isMine && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  You
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500">{formatDate(createdAt)}</p>
          </div>
        </div>

        {/* Numeric rating chip */}
        <RatingChip score={score} />
      </div>

      {/* Body - only show if text exists */}
      {text && text.trim().length > 0 && <ReviewText text={text} />}

      {/* Footer actions */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <HelpfulButton
          kind="helpful"
          isActive={isHelpful}
          count={helpfulCount}
          onClick={() =>
            onToggleHelpful?.(review.id, isHelpful ? 'clear' : 'helpful')
          }
        />
        <HelpfulButton
          kind="unhelpful"
          isActive={isUnhelpful}
          count={unhelpfulCount}
          onClick={() =>
            onToggleHelpful?.(review.id, isUnhelpful ? 'clear' : 'unhelpful')
          }
        />
      </div>
    </article>
  );
};
