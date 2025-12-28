import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import TaggedText from '@/components/posts/TaggedText';
import CourseLocationRow from '@/components/posts/CourseLocationRow';

interface Tag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  start_index?: number;
  end_index?: number;
}

interface GolfCourse {
  id?: string | null;
  name?: string | null;
  region?: string | null;
  country?: string | null;
  sub_country?: string | null;
  slug?: string | null;
}

interface PostMetadataProps {
  title?: string;
  description?: string;
  user: {
    name: string;
    avatar?: string;
  };
  onUserClick?: () => void;
  className?: string;
  /** Tags for @mentions */
  tags?: Tag[];
  /** Golf course for "Played at" CTA */
  golfCourse?: GolfCourse | null;
}

const PostMetadata = ({ title, description, user, onUserClick, className, tags, golfCourse }: PostMetadataProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const isMobile = useIsMobile();
  
  const leftPadding = isMobile ? 'left-4' : 'left-8'; // 16px mobile, 32px desktop
  const rightOffset = 'right-28'; // ~112px to avoid engagement rail

  return (
    <div 
      className={cn(
        "absolute z-overlay pointer-events-none",
        leftPadding,
        rightOffset,
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(6px, var(--bottom-nav-height, 72px) + 12px - var(--chrome-bottom-shift, 0px), calc(var(--bottom-nav-height, 72px) + 12px)))', // ~84px when visible, ~6px when hidden
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
          <SquircleAvatar
            size={44}
            src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
            alt={user.name}
            className="flex-shrink-0 shadow-sm"
          />
          <span 
            className="text-body-md font-medium text-white drop-shadow-sm leading-snug"
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

      {/* Description with mention parsing */}
      {description && (
        <div className="text-white/85 pointer-events-auto">
          <div
            className={cn(
              "text-[14px] leading-snug",
              !showFullDescription && "line-clamp-2"
            )}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            {tags && tags.length > 0 ? (
              <TaggedText 
                text={description} 
                tags={tags}
                className="text-white/85"
              />
            ) : (
              description
            )}
          </div>
          
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
      
      {/* Course CTA row */}
      {golfCourse && (
        <div className="mt-2 pointer-events-auto">
          <CourseLocationRow 
            course={golfCourse}
            isDark={true}
            showChevron={true}
          />
        </div>
      )}
    </div>
  );
};

export default PostMetadata;