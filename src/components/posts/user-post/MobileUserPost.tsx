/**
 * MobileUserPost - Mobile post card with visibility-based autoplay
 * 
 * UNIFIED WITH CLUBHOUSE: Uses IntersectionObserver for autoplay
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import { useVideoPreloader } from '@/hooks/useVideoPreloader';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import LazyImage from '@/components/ui/lazy-image';
import { Skeleton } from '@/components/ui/skeleton';
import PlayedAtLine from '../PlayedAtLine';
import { UserPostData, GolfCourse } from './types';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import SoundtrackStrip from '@/components/studio/SoundtrackStrip';
import { cn } from '@/lib/utils';


interface MobileUserPostProps {
  post: UserPostData;
  displayName: string;
  timeAgo: string;
  /** @deprecated Use courses array instead */
  golfCourse: GolfCourse | null;
  /** Array of golf courses for multi-course support */
  courses?: GolfCourse[];
  rawCourseId?: string | null;
  onProfileClick: () => void;
  onMediaClick: (mediaUrl: string, mediaType: 'image' | 'video', currentIndex?: number) => void;
  onDeletePost: () => void;
}

export const MobileUserPost: React.FC<MobileUserPostProps> = ({
  post,
  displayName,
  timeAgo,
  golfCourse,
  courses: coursesProp,
  rawCourseId,
  onProfileClick,
  onMediaClick,
  onDeletePost
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const { user } = useSupabaseSession();
  
  // Normalize courses: use coursesProp if provided, else wrap golfCourse for backward compat
  const courses = coursesProp && coursesProp.length > 0 
    ? coursesProp 
    : (golfCourse ? [golfCourse] : []);
  
  // Visibility-based autoplay (40% threshold)
  const postRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const hasVideo = post.post_media?.some(m => m.media_type === 'video');
    if (!hasVideo) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.intersectionRatio >= 0.4);
      },
      { threshold: [0, 0.4, 0.5, 1.0] }
    );
    
    if (postRef.current) {
      observer.observe(postRef.current);
    }
    
    return () => observer.disconnect();
  }, [post.post_media]);

  // Predictive preloading for smoother experience
  const allVideos = post.post_media
    .filter(media => media.media_type === 'video')
    .map((media, index) => ({ 
      id: `${post.id}-${index}`, 
      url: media.media_url 
    }));
  
  const { isPreloaded } = useVideoPreloader(allVideos, currentMediaIndex);

  // Check if this is the user's own post
  const isOwnPost = user?.id === post.user.id;

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (post.post_media.length > 1) {
        eventData.event.preventDefault();
        eventData.event.stopPropagation();
        setCurrentMediaIndex(prev => {
          const newIndex = prev < post.post_media.length - 1 ? prev + 1 : 0;
          // Reset loading state for videos when switching
          if (post.post_media[newIndex]?.media_type === 'video') {
            setIsVideoLoading(true);
          }
          return newIndex;
        });
      }
    },
    onSwipedRight: (eventData) => {
      if (post.post_media.length > 1) {
        eventData.event.preventDefault();
        eventData.event.stopPropagation();
        setCurrentMediaIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : post.post_media.length - 1;
          // Reset loading state for videos when switching
          if (post.post_media[newIndex]?.media_type === 'video') {
            setIsVideoLoading(true);
          }
          return newIndex;
        });
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

  // Reset loading state when media changes
  useEffect(() => {
    if (currentMedia?.media_type === 'video') {
      setIsVideoLoading(true);
    }
  }, [currentMedia?.media_url]);
  
  return (
    <div 
      ref={postRef}
      className="relative w-full bg-media-loading"
    >
      {/* Media Container */}
      <div 
        {...swipeHandlers}
        className="relative w-full aspect-[4/5] cursor-pointer" 
        onClick={() => onMediaClick(currentMedia.media_url, currentMedia.media_type)}
      >
        {(() => {
          const studioEdits = (currentMedia as any).studio_edits;
          const filterClass = getFilterClass(studioEdits?.filter || (currentMedia as any).filter_id);
          const cropClass = getCropWrapperClass(studioEdits?.crop);
          const pixelStyle = getPixelLayerStyle(studioEdits);
          
          return (
            <div className={cn("w-full h-full", cropClass)}>
              {currentMedia.media_type === 'video' ? (
                <>
                  {/* Show skeleton while video is loading */}
                  {isVideoLoading && (
                    <Skeleton className="absolute inset-0 z-10" />
                  )}
                  
                  <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
                    <EnhancedVideoPlayer
                      src={currentMedia.media_url}
                      autoplay={isVisible}
                      muted={true}
                      loop={true}
                      className="w-full h-full"
                      enableHLS={true}
                      onPlay={() => setIsVideoLoading(false)}
                      onPause={() => {}}
                    />
                  </div>
                </>
              ) : (
                <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
                  <LazyImage
                    src={currentMedia.media_url}
                    alt="Post content"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* Text overlays */}
              {studioEdits?.textOverlays?.length > 0 && (
                <TextOverlayRenderer
                  textOverlays={studioEdits.textOverlays}
                  isEditable={false}
                  safeAreaContext="feed"
                />
              )}
            </div>
          );
        })()}
        
        {/* Music strip */}
        {(() => {
          const musicEdits = (currentMedia as any).studio_edits;
          return musicEdits?.music && (
            <div className="absolute bottom-16 left-4 z-20 max-w-[200px]">
              <SoundtrackStrip music={musicEdits.music} variant="published" />
            </div>
          );
        })()}

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


        {/* Media Navigation Arrows */}
        {post.post_media.length > 1 && (
          <>
            {/* Left Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

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
          {/* Golf Courses Location - Above Caption (show all courses) */}
          {courses.length > 0 && (
            <div className="mb-2 space-y-1">
              {courses.map((course) => (
                <PlayedAtLine
                  key={course.id}
                  courseId={course.id}
                  courseName={course.name}
                  regionText={course.country || course.region || ''}
                />
              ))}
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
