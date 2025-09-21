import React, { useState } from 'react';
import { Music } from 'lucide-react';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  verified?: boolean;
}

interface AudioTrack {
  title: string;
  artist?: string;
  isOriginal?: boolean;
}

interface FeedMetaProps {
  user?: User;
  caption?: string;
  audioTrack?: AudioTrack;
  className?: string;
}

const FeedMeta: React.FC<FeedMetaProps> = ({ 
  user, 
  caption, 
  audioTrack,
  className 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const cleanCaption = caption ? removeGolfCourseFromContent(caption) : '';
  const shouldShowMore = cleanCaption && cleanCaption.length > 100;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={cn(
        "absolute bottom-20 left-4 right-28 z-20",
        "bg-black/20 backdrop-blur-xl border border-white/15 rounded-2xl",
        "p-4 shadow-2xl transition-all duration-300",
        className
      )}
      style={{ 
        backdropFilter: 'blur(40px) saturate(180%)',
        marginBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* User Profile Section */}
      {user && (
        <div className="flex items-center space-x-3 mb-3">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <img
              src={user.avatar || '/placeholder.svg'}
              alt={user.name || 'User'}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
          
          {/* Username and Handle */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span 
                className="font-bold text-white text-lg truncate" 
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                {user.name || 'Unknown User'}
              </span>
              {user.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            {user.username && (
              <span 
                className="text-white/70 text-sm truncate" 
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                @{user.username}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Caption Text */}
      {cleanCaption && (
        <div className="mb-3">
          <div 
            className={cn(
              "text-white text-base font-medium leading-relaxed",
              !isExpanded && "line-clamp-2"
            )}
            style={{ 
              textShadow: '0 1px 3px rgba(0,0,0,0.7)',
              wordBreak: 'break-word'
            }}
          >
            {cleanCaption}
            {shouldShowMore && !isExpanded && (
              <button
                onClick={toggleExpanded}
                className="ml-2 text-white/80 hover:text-white transition-colors"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                ...more
              </button>
            )}
          </div>
          {isExpanded && shouldShowMore && (
            <button
              onClick={toggleExpanded}
              className="mt-1 text-white/80 hover:text-white transition-colors text-sm"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Music Pill */}
      {audioTrack && (
        <div 
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full max-w-full"
          style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
        >
          <Music className="w-4 h-4 text-white flex-shrink-0" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div 
              className="text-white text-sm font-medium truncate animate-marquee-if-needed"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              {audioTrack.isOriginal 
                ? `Original Audio - ${audioTrack.title}`
                : `${audioTrack.title}${audioTrack.artist ? ` - ${audioTrack.artist}` : ''}`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedMeta;