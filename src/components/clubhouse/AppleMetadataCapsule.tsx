/**
 * AppleMetadataCapsule - Compact mini-player style glass card
 * Sits bottom-left, ~70% width on phones
 * 
 * Layout:
 * - 40px squircle avatar (no ring)
 * - Text column: name · time, caption (2-line), course pill
 * - Overall height: 72-80px depending on content
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/utils/relativeTime';
import SquircleImage from '@/components/ui/SquircleImage';

interface AppleMetadataCapsuleProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    username?: string;
  };
  caption?: string;
  createdAt?: string;
  courseName?: string;
  courseRating?: number;
  onProfileSheetOpen?: () => void;
  onMoreClick?: () => void;
  onCourseClick?: () => void;
  className?: string;
}

export const AppleMetadataCapsule = ({
  user,
  caption,
  createdAt,
  courseName,
  courseRating,
  onProfileSheetOpen,
  onMoreClick,
  onCourseClick,
  className
}: AppleMetadataCapsuleProps) => {
  const timeLabel = createdAt ? relativeTime(createdAt) : null;

  return (
    <div
      className={cn(
        'glass-dark flex min-w-0 items-center gap-3 px-3 py-2',
        className
      )}
    >
      {/* Avatar – 40px squircle, no ring */}
      <button
        type="button"
        onClick={onProfileSheetOpen}
        className="flex-shrink-0"
        aria-label={user?.name ? `View profile for ${user.name}` : 'View profile'}
      >
        <div className="h-10 w-10 overflow-hidden">
          <SquircleImage
            size={40}
            src={user?.avatar || '/placeholder.svg'}
            alt={user?.name ?? 'Golfer'}
            ringWidth={0}
          />
        </div>
      </button>

      {/* Text column */}
      <div className="flex min-w-0 flex-col gap-1">
        {/* Row 1: name */}
        <div className="flex items-center gap-1 text-[13px] font-semibold text-white">
          <span className="truncate">{user?.name ?? 'Golfer'}</span>
        </div>

        {/* Row 2: caption (2-line clamp) */}
        {caption && (
          <button
            type="button"
            onClick={onMoreClick}
            className="text-left text-[12px] text-white/80 line-clamp-2 hover:opacity-80 transition-opacity"
          >
            {caption}
          </button>
        )}

        {/* Row 3: course pill (optional) */}
        {courseName && (
          <button
            type="button"
            onClick={onCourseClick}
            className="course-pill mt-0.5 inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/80 hover:bg-white/15 transition-colors"
          >
            <span className="course-pill-label truncate">{courseName}</span>
            {typeof courseRating === 'number' && (
              <span className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                <span>·</span>
                <span>★ {courseRating.toFixed(1)}</span>
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
