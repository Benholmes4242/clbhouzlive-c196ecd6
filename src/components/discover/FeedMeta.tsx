import React, { useState } from 'react';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
}

interface FeedMetaProps {
  user: User;
  caption?: string | null;
  musicTrack?: string;
  className?: string;
}

const FeedMeta: React.FC<FeedMetaProps> = ({
  user,
  caption,
  musicTrack,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if caption needs clamping (more than 2 lines worth of text)
  const needsClamping = caption && caption.length > 100;
  const displayCaption = needsClamping && !isExpanded 
    ? caption.slice(0, 100) + '...' 
    : caption;

  return (
    <div 
      className={cn(
        "fixed left-4 right-20 z-20",
        "pb-[env(safe-area-inset-bottom,0px)]",
        className
      )}
      style={{
        bottom: `calc(16px + env(safe-area-inset-bottom, 0px))`
      }}
    >
      {/* Main metadata card */}
      <div 
        className="rounded-2xl backdrop-blur-xl border p-4 space-y-3 max-w-sm"
        style={{
          background: 'var(--hud-bg)',
          borderColor: 'var(--hud-border)',
          boxShadow: 'var(--hud-shadow)',
          backdropFilter: 'blur(40px) saturate(180%)'
        }}
      >
        {/* User info section */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          
          {/* User details */}
          <div className="flex flex-col min-w-0 flex-1">
            <span 
              className="font-bold text-white text-base truncate"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {user.name}
            </span>
            {user.username && (
              <span 
                className="text-white/70 text-sm truncate"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              >
                @{user.username}
              </span>
            )}
          </div>
        </div>

        {/* Caption section */}
        {caption && (
          <div className="space-y-1">
            <p 
              className={cn(
                "text-white text-sm leading-relaxed",
                !isExpanded && needsClamping && "line-clamp-2"
              )}
              style={{ 
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                wordBreak: 'break-word'
              }}
            >
              {displayCaption}
            </p>
            
            {/* Expand/collapse button */}
            {needsClamping && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white/80 text-sm font-medium hover:text-white transition-colors"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              >
                {isExpanded ? 'less' : 'more'}
              </button>
            )}
          </div>
        )}

        {/* Music pill */}
        {musicTrack && (
          <div 
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 max-w-full"
            style={{
              background: 'var(--hud-bg)',
              borderColor: 'var(--hud-border)',
              border: '1px solid var(--hud-border)',
              backdropFilter: 'blur(20px) saturate(150%)'
            }}
          >
            <Music className="w-4 h-4 text-white/90 flex-shrink-0" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <div 
                className={cn(
                  "text-white/90 text-sm font-medium whitespace-nowrap",
                  musicTrack.length > 25 && "animate-marquee"
                )}
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              >
                {musicTrack}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedMeta;