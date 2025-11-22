/**
 * AppleMetadataCapsule - Compact mini-player style glass card
 * Sits bottom-left, ~70% width on phones
 * 
 * Layout:
 * - 52px squircle avatar (no ring)
 * - Text column: name, caption (2-line), course pill
 * - Overall height: 80-90px depending on content
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

const AppleMetadataCapsuleBase = ({
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
        'glass-dark flex min-w-0 items-center gap-3 px-4 py-3 rounded-2xl min-w-[240px] max-w-[300px]',
        className
      )}
    >
      {/* Avatar – 52px squircle, no ring */}
      <button
        type="button"
        onClick={onProfileSheetOpen}
        className="flex-shrink-0"
        aria-label={user?.name ? `View profile for ${user.name}` : 'View profile'}
      >
        <div className="h-[52px] w-[52px] overflow-hidden">
          <SquircleImage
            size={52}
            src={user?.avatar || '/placeholder.svg'}
            alt={user?.name ?? 'Golfer'}
            ringWidth={0}
          />
        </div>
      </button>

      {/* Text column - centered within remaining space */}
      <div className="flex flex-1 min-w-0 flex-col items-center text-center gap-0.5">
        {/* Row 1: name (tap → mini profile) */}
        <button
          type="button"
          onClick={onProfileSheetOpen}
          className="w-full truncate text-[13px] font-semibold text-white"
          aria-label={user?.name ? `View profile for ${user.name}` : 'View profile'}
        >
          {user?.name ?? 'Golfer'}
        </button>

        {/* Row 2: caption (2-line clamp) - non-interactive */}
        {caption && (
          <p className="w-full text-[12px] text-white/80 line-clamp-2">
            {caption}
          </p>
        )}

        {/* Row 3: course pill (optional) */}
        {courseName && (
          <div className="mt-0.5 flex w-full justify-center">
            <button
              type="button"
              onClick={onCourseClick}
              className="course-pill inline-flex items-center justify-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/80 hover:bg-white/15 transition-colors"
            >
              <span className="course-pill-label truncate">{courseName}</span>
              {typeof courseRating === 'number' && (
                <span className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                  <span>·</span>
                  <span>★ {courseRating.toFixed(1)}</span>
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AppleMetadataCapsule = React.memo(AppleMetadataCapsuleBase);
AppleMetadataCapsule.displayName = 'AppleMetadataCapsule';
