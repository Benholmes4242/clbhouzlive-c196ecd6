import React from 'react';
import { clsx } from 'clsx';
import SquircleImage from '@/components/ui/SquircleImage';
import { ScorePill } from '../common/ScorePill';
import { ThumbButton } from '@/components/common/ThumbButton';
import { ExpandableText } from '@/components/common/ExpandableText';

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
}

interface ReviewCardProps {
  review: Review;
  isMine?: boolean;
  isHighlighted?: boolean;
  onToggleHelpful?: (id: string, value: 'helpful' | 'unhelpful' | 'clear') => void;
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
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isMine,
  isHighlighted,
  onToggleHelpful,
  disabled,
}) => {
  const { user, score, text, createdAt, isHelpful, isUnhelpful, helpfulCount, unhelpfulCount, isMock } =
    review;

  // Disable voting on mock reviews or when explicitly disabled
  const votingDisabled = disabled || isMock || false;

  return (
    <article
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white px-4 py-3 mb-3',
        'shadow-sm transition-all duration-100 active:scale-[0.98] hover:shadow-md',
        isHighlighted && 'animate-soft-pulse'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
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
        <ScorePill score={score} size="sm" />
      </div>

      {/* Body - expandable text */}
      {text && text.trim().length > 0 && (
        <div className="mt-1">
          <ExpandableText text={text} lines={4} />
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <ThumbButton
          type="up"
          active={isHelpful || false}
          count={helpfulCount}
          onClick={() =>
            !votingDisabled && onToggleHelpful?.(review.id, isHelpful ? 'clear' : 'helpful')
          }
          disabled={votingDisabled}
        />
        <ThumbButton
          type="down"
          active={isUnhelpful || false}
          count={unhelpfulCount}
          onClick={() =>
            !votingDisabled && onToggleHelpful?.(review.id, isUnhelpful ? 'clear' : 'unhelpful')
          }
          disabled={votingDisabled}
        />
      </div>
    </article>
  );
};
