import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import VideoPlayer from '@/components/ui/video-player';
import LazyImage from '@/components/ui/lazy-image';
import CoursePostBadge from '../CoursePostBadge';
import { UserPostData, GolfCourse } from './types';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface IndexFeedPostProps {
  post: UserPostData;
  displayName: string;
  timeAgo: string;
  golfCourse: GolfCourse | null;
  onProfileClick: () => void;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  onDeletePost: () => void;
}

export const IndexFeedPost: React.FC<IndexFeedPostProps> = ({
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
    return null; // No media posts don't get special treatment in index feed
  }

  const currentMedia = post.post_media[currentMediaIndex];
  const cleanContent = removeGolfCourseFromContent(post.content);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden"
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Media Container - Square aspect ratio */}
      <div 
        {...swipeHandlers}
        className="relative w-full aspect-square cursor-pointer" 
        onClick={() => onMediaClick(currentMedia.media_url, currentMedia.media_type)}
      >
        {currentMedia.media_type === 'video' ? (
          <VideoPlayer
            src={currentMedia.media_url}
            autoplay={isHovered}
            muted={true}
            loop={true}
            className="w-full h-full object-cover"
            showVideoIcon={false}
            showOverlayControls={false}
            videoId={`index-${currentMedia.id}`}
          />
        ) : (
          <LazyImage
            src={currentMedia.media_url}
            alt="Post content"
            className="w-full h-full object-cover object-center"
          />
        )}

        {/* TOP-LEFT: User Info Pill */}
        <div className="absolute top-3 left-3 z-20">
          <div 
            className="flex items-center bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-md backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/30 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick();
            }}
          >
            <LazyImage
              src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={displayName}
              className="w-6 h-6 rounded-full mr-1.5 border border-white border-opacity-20"
              width={24}
              height={24}
            />
            <span className="text-sm font-medium">{displayName}</span>
          </div>
        </div>

        {/* TOP-RIGHT: Golf Club Tag */}
        {golfCourse && (
          <div className="absolute top-3 right-3 z-20">
            <CoursePostBadge 
              course={{
                id: golfCourse.id,
                name: golfCourse.name,
                country: golfCourse.country,
                region: golfCourse.region
              }}
              className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-md backdrop-blur-sm border border-white/20"
            />
          </div>
        )}

        {/* BOTTOM-LEFT: Caption Overlay Pill */}
        {cleanContent && (
          <div className="absolute bottom-3 left-3 z-20 max-w-[70%] group">
            <div 
              className="bg-white/20 text-white text-sm font-normal px-3 py-1.5 rounded-md backdrop-blur-sm border border-white/20 cursor-default group-hover:bg-white/30 transition-all duration-200"
              title={`${cleanContent}${post.post_tags && post.post_tags.length > 0 ? ' ' + post.post_tags.map(tag => `@${tag.name}`).join(' ') : ''}`}
            >
              <div className="truncate group-hover:whitespace-normal group-hover:break-words group-hover:max-w-xs text-center">
                {cleanContent}
                {post.post_tags && post.post_tags.length > 0 && (
                  <span>
                    {' '}
                    {post.post_tags.map((tag) => (
                      <span key={tag.id} className="text-blue-400 font-medium">
                        @{tag.name}{' '}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM-RIGHT: Interaction Icons Stack */}
        <div className="absolute bottom-3 right-3 z-20">
          <div className="flex flex-col items-center gap-2.5 text-white text-lg opacity-90">
            <button 
              className="cursor-pointer hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="w-5 h-5" />
            </button>
            <button 
              className="cursor-pointer hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button 
              className="cursor-pointer hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Share className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Navigation Dots */}
        {post.post_media.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {post.post_media.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentMediaIndex ? 'bg-white' : 'bg-white bg-opacity-40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};