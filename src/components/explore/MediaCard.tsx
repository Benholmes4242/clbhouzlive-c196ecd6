
import React, { useState, memo } from 'react';
import { Heart, Maximize2 } from 'lucide-react';
import { ExploreContentItem } from './types';

import PostViewerModal from '@/components/posts/PostViewerModal';
import VideoPlayer from '@/components/ui/video-player';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import OptimizedImage from '@/components/ui/optimized-image';
import CoursePostBadge from '@/components/posts/CoursePostBadge';

interface MediaCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onFollow, ...props }) => {
  const [imageError, setImageError] = useState(false);
  const [isPostViewerOpen, setIsPostViewerOpen] = useState(false);
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay({
    enabled: true,
    threshold: 0.5
  });

  if (item.type === 'cta') return null;

  // Removed excessive logging for performance

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(item.id);
  };

  const handleMediaClick = () => {
    // Only open media for image and video types, not CTA
    if (item.type === 'image' || item.type === 'video') {
      console.log('MediaCard handleMediaClick - item.golfCourse:', item.golfCourse);
      // Call the onMediaClick prop instead of opening the post viewer modal
      if (props.onMediaClick) {
        props.onMediaClick(item);
      } else {
        setIsPostViewerOpen(true);
      }
    }
  };

  // Transform ExploreContentItem to PostData format
  const transformedPost = {
    id: item.id,
    content: item.title || null,
    created_at: new Date().toISOString(), // ExploreContentItem doesn't have created_at
    user: {
      id: item.user?.id || 'unknown',
      display_name: item.user?.name || 'Unknown User',
      username: item.user?.name || null,
      profile_photo_url: item.user?.avatar || null,
    },
    post_media: [{
      id: `${item.id}-media`,
      media_type: item.type as 'image' | 'video',
      media_url: item.src,
    }],
    post_tags: [],
    golfCourse: item.golfCourse,
  };

  const handleImageError = () => {
    console.log('Image load error for item:', {
      id: item.id, 
      src: item.src,
      errorType: 'IMAGE_LOAD_FAILED'
    });
    setImageError(true);
  };

  // Fallback image for broken/missing images
  const fallbackImage = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

  // Enhanced validation for invalid src
  const isInvalidSrc = !item.src || 
                      item.src.trim() === '' || 
                      item.src === 'null' || 
                      item.src === 'undefined' ||
                      item.src === '[object Object]' ||
                      typeof item.src !== 'string';

  return (
    <>
      <div 
        ref={autoplayRef}
        className="relative group bg-white rounded-lg shadow-sm border overflow-hidden h-full cursor-pointer"
        onClick={handleMediaClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Square Media Container */}
        <div className="relative w-full h-full overflow-hidden">
          {item.type === 'video' && !isInvalidSrc ? (
            <VideoPlayer
              src={item.src}
              autoplay={shouldAutoplay}
              muted={true}
              loop={true}
              className="w-full h-full pointer-events-none"
              showVideoIcon={false}
              showOverlayControls={false}
              controls={false}
              onClick={undefined}
              videoId={`explore-${item.id}`}
            />
          ) : (
            <img
              src={isInvalidSrc || imageError ? fallbackImage : item.src}
              alt={item.title || 'Content'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              loading="lazy"
            />
          )}

          {/* Like button overlay - hidden on mobile */}
          <div className="absolute bottom-1 left-3 hidden md:block pointer-events-auto z-20">
            <button
              onClick={handleLike}
              className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
            >
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span className="font-medium text-sm">{item.likes}</span>
              </div>
            </button>
          </div>

          {/* Maximize button overlay - hidden on mobile */}
          <div className="absolute bottom-1 right-1 hidden md:block pointer-events-auto z-20">
            <button
              onClick={handleMediaClick}
              className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>


          {/* User info overlay - hidden on mobile */}
          {item.user && (
            <div className="absolute top-2 left-2 flex items-center space-x-2 hidden md:flex">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="w-14 h-14 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                }}
              />
              <span className="text-white text-sm font-bold drop-shadow-lg">
                {item.user.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <PostViewerModal
        isOpen={isPostViewerOpen}
        onClose={() => setIsPostViewerOpen(false)}
        initialPost={transformedPost}
        allUserPosts={[transformedPost]}
      />
    </>
  );
};

export default memo(MediaCard);
