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
  tags?: string[];
  onUserClick?: () => void;
  onMoreClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export const AppleMetadataCapsule = ({
  user,
  caption,
  createdAt,
  courseName,
  tags,
  onUserClick,
  onMoreClick,
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
      {/* Glass panel */}
      <div
        className="flex items-start gap-2 px-3 py-2 rounded-2xl backdrop-blur-[18px] border border-white/10 max-w-[calc(100vw-120px)]"
        style={{
          background: 'rgba(30,30,30,0.35)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        {/* Avatar with subtle ring */}
        <button
          onClick={onUserClick}
          className="flex-shrink-0"
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
          {/* Line 1: name + timestamp */}
          <div className="flex items-center gap-1 text-[13px] font-semibold text-white">
            <button onClick={onUserClick} className="truncate hover:opacity-80 transition-opacity">
              {user.name}
            </button>
            {createdAt && (
              <span className="text-white/60 flex-shrink-0">· {relativeTime(createdAt)}</span>
            )}
          </div>

          {/* Line 2: caption */}
          {caption && (
            <button
              type="button"
              className="text-[13px] text-white/80 text-left line-clamp-2 hover:opacity-80 transition-opacity"
              onClick={onMoreClick}
            >
              {caption}
            </button>
          )}

          {/* Row 3: course + tags */}
          {(courseName || (tags && tags.length > 0)) && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {courseName && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80 flex-shrink-0">
                  {courseName}
                </span>
              )}
              {tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/6 px-2 py-0.5 text-[11px] text-white/70 flex-shrink-0"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
