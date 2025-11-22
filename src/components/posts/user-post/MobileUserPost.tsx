import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useVideoPreloader } from '@/hooks/useVideoPreloader';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import LazyImage from '@/components/ui/lazy-image';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const { user } = useSupabaseSession();
  
  const { ref: containerRef, isInView } = useIntersectionObserver({
    threshold: 0.75, // Instagram-style 75% visibility
    rootMargin: '50px'
  });

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

  useEffect(() => {
    const now = new Date().toLocaleTimeString();
    const debugMsg = `${now}: isInView=${isInView}, mediaType=${post.post_media?.[currentMediaIndex]?.media_type}, isHovered=${isHovered}`;
    
    console.log('🔍 MobileUserPost: useEffect triggered', {
      isInView,
      currentMediaIndex,
      mediaType: post.post_media?.[currentMediaIndex]?.media_type,
      postId: post.id,
      isHovered
    });
    
    setDebugInfo(prev => [...prev.slice(-4), debugMsg]); // Keep last 5 debug messages
    
    // For mobile, just use intersection observer for autoplay
    if (isInView && post.post_media?.[currentMediaIndex]?.media_type === 'video') {
      console.log('📱 MobileUserPost: Setting isHovered to true for video', post.id);
      setIsHovered(true);
    } else if (!isInView) {
      console.log('📱 MobileUserPost: Setting isHovered to false (not in view)', post.id);
      setIsHovered(false);
    }
    // Don't reset isHovered when still in view on mobile
  }, [isInView, currentMediaIndex, post.post_media]);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-media-loading"
    >
      {/* Media Container */}
      <div 
        {...swipeHandlers}
        className="relative w-full aspect-[4/5] cursor-pointer" 
        onClick={() => onMediaClick(currentMedia.media_url, currentMedia.media_type)}
      >
        {currentMedia.media_type === 'video' ? (
          <>
            {/* Show skeleton while video is loading */}
            {isVideoLoading && (
              <Skeleton className="absolute inset-0 z-10" />
            )}
            
            <EnhancedVideoPlayer
              src={currentMedia.media_url}
              autoplay={isHovered}
              muted={true}
              loop={true}
              className="w-full h-full"
              enableHLS={true}
              onPlay={() => setIsVideoLoading(false)}
              onPause={() => {}}
            />
          </>
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

         {/* Debug Info Overlay - Only visible on mobile */}
         {currentMedia.media_type === 'video' && (
           <div className="absolute top-16 left-2 bg-black/80 text-white text-xs p-2 rounded max-w-[250px] z-30 font-mono">
             <div className="font-bold mb-1">DEBUG INFO:</div>
             <div>Post: {post.id.slice(-8)}</div>
             <div>InView: {isInView ? 'YES' : 'NO'}</div>
             <div>IsHovered: {isHovered ? 'YES' : 'NO'}</div>
             <div>MediaType: {currentMedia.media_type}</div>
             <div className="mt-1 text-yellow-300">Recent events:</div>
             {debugInfo.slice(-3).map((info, idx) => (
               <div key={idx} className="text-xs truncate">{info}</div>
             ))}
           </div>
         )}
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