import React from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ThumbButton } from '@/components/common/ThumbButton';
import { ExpandableText } from '@/components/common/ExpandableText';
import { ReviewMediaStrip, ReviewMediaItem } from './ReviewMediaStrip';
import { RatingBreakdownGrid } from '../shared/RatingBreakdownGrid';

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

// Category labels for breakdown
const categoryLabels: Record<string, string> = {
  design_score: 'Design',
  condition_score: 'Condition',
  clubhouse_score: 'Clubhouse',
  facilities_score: 'Facilities',
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

  // Build category scores
  const categories = [
    { key: 'design_score', value: review.design_score },
    { key: 'condition_score', value: review.condition_score },
    { key: 'clubhouse_score', value: review.clubhouse_score },
    { key: 'facilities_score', value: review.facilities_score },
  ].filter(c => c.value !== null && c.value !== undefined);

  return (
    <article
      data-review-id={review.id}
      className={cn(
        'bg-card rounded-2xl border p-5 transition-all',
        isMine ? 'border-green-200 ring-1 ring-green-100' : 'border-border',
        isHighlighted && 'animate-soft-pulse'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {user.avatarUrl ? (
              <SquircleAvatar
                src={user.avatarUrl}
                alt={user.name}
                size={40}
                fallback={user.initials}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                {user.initials}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{user.name}</span>
              {isMine && (
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  You
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Score badge - Amber for Outstanding (9+), Gray otherwise */}
        <div className={cn(
          "px-2.5 py-1 rounded-lg text-sm font-bold",
          score >= 9 
            ? 'bg-[#f59e0b] text-white'
            : 'bg-[#A8A29E] text-white'
        )}>
          {score.toFixed(1)}
        </div>
      </div>

      {/* Review text */}
      {text && text.trim().length > 0 && (
        <div className="mb-4">
          <ExpandableText 
            text={text} 
            lines={4} 
            className="text-muted-foreground leading-relaxed"
          />
        </div>
      )}

      {/* Media strip - shared component */}
      {media && media.length > 0 && onMediaClick && (
        <div className="mb-4">
          <ReviewMediaStrip media={media} onMediaClick={onMediaClick} variant="compact" />
        </div>
      )}

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="mb-4 py-3 border-y border-border">
          <RatingBreakdownGrid
            categories={categories.map(c => ({
              label: categoryLabels[c.key],
              value: c.value,
            }))}
          />
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-4">
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