import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PostMetadataProps {
  title?: string;
  description?: string;
  user: {
    name: string;
    avatar?: string;
  };
  onUserClick?: () => void;
  className?: string;
}

const PostMetadata = ({ title, description, user, onUserClick, className }: PostMetadataProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const isMobile = useIsMobile();
  
  const leftPadding = isMobile ? 'left-4' : 'left-8'; // 16px mobile, 32px desktop
  const rightOffset = 'right-28'; // ~112px to avoid engagement rail

  return (
    <div 
      className={cn(
        "absolute z-overlay pointer-events-none chrome-follow-bottom",
        leftPadding,
        rightOffset,
        className
      )}
      style={{
        bottom: 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 12px)', // aligned to share icon baseline (nav + safe area + gap)
      }}
    >
      {/* User Profile */}
      <div className="flex items-center gap-3 mb-3 pointer-events-auto">
        <button
          data-action="profile"
          onClick={onUserClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label={`View ${user.name}'s profile`}
        >
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
            alt={user.name}
            className="w-11 h-11 rounded-full object-cover shadow-sm flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
            }}
          />
          <span 
            className="text-[15px] font-medium tracking-[0.02em] text-white drop-shadow-sm leading-none"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            {user.name}
          </span>
        </button>
      </div>

      {/* Title */}
      {title && (
        <h3 
          className={cn(
            "font-semibold text-white mb-2",
            isMobile ? "text-lg" : "text-xl"
          )}
          style={{ 
            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            lineHeight: '1.3'
          }}
        >
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <div className="text-white/85 pointer-events-auto">
          <p
            className={cn(
              "text-[14px] leading-snug",
              !showFullDescription && "line-clamp-2"
            )}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            {description}
          </p>
          
          {description.length > 100 && (
            <button
              data-action="description-toggle"
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-white/80 text-sm mt-1 hover:text-white transition-colors"
              style={{ 
                textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                minWidth: '44px',
                minHeight: '44px'
              }}
              aria-label={showFullDescription ? 'Show less description' : 'Show more description'}
            >
              {showFullDescription ? '... less' : '... more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PostMetadata;