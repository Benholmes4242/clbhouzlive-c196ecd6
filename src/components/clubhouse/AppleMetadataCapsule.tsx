/**
 * AppleMetadataCapsule - Bottom-left glass panel with user info, caption, course, and tags
 * Part of the Apple-style Clubhouse redesign (upgraded to two-line info panel)
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/utils/relativeTime';

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
  tags?: string[];
  onProfileSheetOpen?: () => void;
  onMoreClick?: () => void;
  onCourseClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export const AppleMetadataCapsule = ({
  user,
  caption,
  createdAt,
  courseName,
  courseRating,
  tags,
  onProfileSheetOpen,
  onMoreClick,
  onCourseClick,
  isActive = false,
  className
}: AppleMetadataCapsuleProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Slide up + fade in animation when active
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-out",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-8 opacity-0",
        className
      )}
    >
      {/* Dark glass panel */}
      <div className="glass-dark flex items-start gap-2 px-3 py-2 max-w-[calc(100vw-120px)]">
        {/* Avatar with subtle ring */}
        <button
          type="button"
          onClick={onProfileSheetOpen}
          className="flex-shrink-0 mt-0.5"
          aria-label={`View ${user.name}'s profile`}
        >
          <div 
            className="relative w-10 h-10 rounded-full overflow-hidden"
            style={{
              boxShadow: '0 0 4px rgba(255,255,255,0.5), inset 0 0 0 1px #6e9277',
            }}
          >
            <img 
              src={user.avatar || '/placeholder.svg'} 
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
        </button>

        {/* Content */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* Row 1: name · time */}
          <div className="flex items-center gap-1 text-[13px] font-semibold text-white">
            <span className="truncate">{user.name}</span>
            {createdAt && (
              <span className="text-[12px] font-normal text-white/60 flex-shrink-0">
                · {relativeTime(createdAt)}
              </span>
            )}
          </div>

          {/* Row 2: caption (2-line clamp + More) */}
          {caption && (
            <button
              type="button"
              className="text-[13px] text-white/80 text-left line-clamp-2 hover:opacity-80 transition-opacity"
              onClick={onMoreClick}
            >
              {caption}
            </button>
          )}

          {/* Row 3: course pill only */}
          {courseName && (
            <button
              type="button"
              onClick={onCourseClick}
              className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80"
            >
              <span className="truncate">{courseName}</span>
              {typeof courseRating === 'number' && (
                <span className="flex items-center gap-0.5 flex-shrink-0">
                  <span>·</span>
                  <span>★ {courseRating.toFixed(1)}</span>
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
