import React from 'react';
import { clsx } from 'clsx';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ScorePill } from '../common/ScorePill';
import { ThumbButton } from '@/components/common/ThumbButton';
import { ExpandableText } from '@/components/common/ExpandableText';
import { ReviewMediaStrip, ReviewMediaItem } from './ReviewMediaStrip';
import { ReviewBreakdownGrid } from './ReviewBreakdownGrid';

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

export const ReviewBlockFlat: React.FC<ReviewBlockFlatProps> = ({
  review,
  isMine,
  isHighlighted,
  onToggleHelpful,
  onMediaClick,
  disabled,
}) => {
  const { user, score, text, createdAt, isHelpful, isUnhelpful, helpfulCount, unhelpfulCount, isMock, media } =
    review;

  const votingDisabled = disabled || isMock || false;

  return (
    <article
      className={clsx(
        'py-4 border-b border-slate-200',
        isHighlighted && 'animate-soft-pulse'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <SquircleAvatar
              src={user.avatarUrl}
              alt={user.name}
              size={40}
              fallback={user.initials}
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
                <span 
                  className="bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                  style={{ borderRadius: 'var(--radius)' }}
                >
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

      {/* Media strip */}
      {media && media.length > 0 && onMediaClick && (
        <ReviewMediaStrip media={media} onMediaClick={onMediaClick} />
      )}

      {/* Breakdown grid */}
      <ReviewBreakdownGrid
        scores={{
          design_score: review.design_score,
          condition_score: review.condition_score,
          clubhouse_score: review.clubhouse_score,
          facilities_score: review.facilities_score,
        }}
      />

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
