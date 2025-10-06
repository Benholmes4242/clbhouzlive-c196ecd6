import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import ExpandableCaption from './ExpandableCaption';

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
  const isMobile = useIsMobile();
  
  const leftPadding = isMobile ? 'left-4' : 'left-8'; // 16px mobile, 32px desktop
  const rightOffset = 'right-28'; // ~112px to avoid engagement rail

  const text = description || title || '';

  return (
    <div 
      className={cn(
        "absolute z-50 pointer-events-none",
        leftPadding,
        rightOffset,
        className
      )}
      style={{ 
        bottom: 'var(--share-bottom-edge)',
        transform: 'translateY(4px)' // optical baseline alignment
      }}
    >
      <div className="pointer-events-auto">
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onUserClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label={`View ${user.name}'s profile`}
          >
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
              }}
            />
            <span 
              className={cn(
                "font-semibold text-white",
                isMobile ? "text-lg" : "text-xl"
              )}
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              {user.name}
            </span>
          </button>
        </div>

        {/* Expandable Caption */}
        {text && (
          <ExpandableCaption
            text={text}
            className={cn(
              "mt-2",
              isMobile ? "text-sm" : "text-base"
            )}
          />
        )}
      </div>
    </div>
  );
};

export default PostMetadata;
