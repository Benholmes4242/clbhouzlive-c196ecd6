import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import LazyImage from '@/components/ui/lazy-image';
import CoursePostBadge from '../CoursePostBadge';
import { UserPostData, GolfCourse } from './types';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface MobileUserPostProps {
  post: UserPostData;
  displayName: string;
  timeAgo: string;
  golfCourse: GolfCourse | null;
  onProfileClick: () => void;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
  onDeletePost: () => void;
}

export const MobileUserPost: React.FC<MobileUserPostProps> = ({
  post,
  displayName,
  timeAgo,
  golfCourse,
  onProfileClick,
  onMediaClick,
  onDeletePost
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useSupabaseSession();
  
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '0px'
  });

  // Check if this is the user's own post
  const isOwnPost = user?.id === post.user.id;

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (post.post_media.length > 1) {
        eventData.event.preventDefault();
        eventData.event.stopPropagation();
        setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
      }
    },
    onSwipedRight: (eventData) => {
      if (post.post_media.length > 1) {
        eventData.event.preventDefault();
        eventData.event.stopPropagation();
        setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
      }
    },
    onSwiping: (eventData) => {
      if (post.post_media.length > 1) {
        eventData.event.preventDefault();
        eventData.event.stopPropagation();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    touchEventOptions: { passive: false }
  });

  useEffect(() => {
    if (isInView && post.post_media?.[currentMediaIndex]?.media_type === 'video') {
      setIsHovered(true);
    } else {
      setIsHovered(false);
    }
  }, [isInView, currentMediaIndex, post.post_media]);

  if (!post.post_media || post.post_media.length === 0) {
    return (
      <div className="bg-background p-4 border-b">
        <div className="flex items-center space-x-3 mb-3">
          <LazyImage
            src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
            alt={displayName}
            className="w-8 h-8 rounded-full cursor-pointer"
            width={32}
            height={32}
            onClick={onProfileClick}
          />
          <div className="text-sm">
            <span className="font-semibold cursor-pointer" onClick={onProfileClick}>
              {displayName}
            </span>
            <span className="ml-2">{removeGolfCourseFromContent(post.content)}</span>
          </div>
        </div>
      </div>
    );
  }

  const currentMedia = post.post_media[currentMediaIndex];
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-media-loading"
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Media Container */}
      <div 
        {...swipeHandlers}
        className="relative w-full aspect-[4/5] cursor-pointer" 
        onClick={() => onMediaClick(currentMedia.media_url, currentMedia.media_type)}
      >
        {currentMedia.media_type === 'video' ? (
           <EnhancedVideoPlayer
             src={currentMedia.media_url}
             autoplay={isHovered}
             muted={true}
             loop={true}
             className="w-full h-full"
             enableHLS={true}
           />
        ) : (
          <LazyImage
            src={currentMedia.media_url}
            alt="Post content"
            className="w-full h-full object-cover"
          />
        )}

        {/* User Info Overlay */}
        <div className="absolute top-3 left-2.5 z-20">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-1.5 flex items-center space-x-2 max-w-[140px]">
            <LazyImage
              src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={displayName}
              className="w-6 h-6 rounded-full border border-white/20 cursor-pointer flex-shrink-0"
              width={24}
              height={24}
              onClick={() => {
                onProfileClick();
              }}
            />
            <div className="text-white text-xs min-w-0">
              <div 
                className="font-semibold cursor-pointer hover:opacity-80 leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
                onClick={() => {
                  onProfileClick();
                }}
                title={displayName}
              >
                {displayName}
              </div>
              <div className="text-xs opacity-80 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                @{post.user.username}
              </div>
            </div>
          </div>
        </div>


        {/* Media Navigation Dots */}
        {post.post_media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {post.post_media.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Engagement Icons */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-3 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-red-500 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Caption & Comments Area */}
      {post.content && removeGolfCourseFromContent(post.content) && (
        <div className="bg-background p-4">
          {/* Golf Course Location - Above Caption */}
          {golfCourse && (
            <div className="mb-2">
              <CoursePostBadge 
                course={{
                  id: golfCourse.id,
                  name: golfCourse.name,
                  country: golfCourse.country,
                  region: golfCourse.region
                }}
                className="text-xs"
              />
            </div>
          )}
          
          <div className="text-sm">
            <div className="mb-1">
              <span className="font-semibold cursor-pointer hover:opacity-80" onClick={onProfileClick}>
                {displayName}
              </span>
              <span className="text-muted-foreground text-xs ml-1">
                · {timeAgo}
              </span>
            </div>
            <div>{removeGolfCourseFromContent(post.content)}</div>
          </div>
          
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div>View all comments</div>
          </div>
        </div>
      )}
    </div>
  );
};