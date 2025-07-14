import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { Heart, MessageCircle, Share, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';

import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { getAvatarSize } from '@/utils/imageOptimization';
import PostViewerModal from '@/components/posts/PostViewerModal';
import { usePostViewer } from '@/hooks/usePostViewer';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import SmartMediaContainer from '@/components/ui/smart-media-container';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface PostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface UserPostData {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: PostMedia[];
  post_tags: PostTag[];
}

interface InstagramStylePostProps {
  post: UserPostData;
  allUserPosts?: UserPostData[];
}

const InstagramStylePostComponent: React.FC<InstagramStylePostProps> = ({ post, allUserPosts = [] }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const { registerVideo, unregisterVideo, pauseAllOtherVideos } = useVideoPlaybackManager();
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source: 'clubhouse' });
  
  // Add video autoplay functionality
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay();
  
  // Memoize current media and other expensive calculations
  const currentMedia = useMemo(() => post.post_media[currentMediaIndex], [post.post_media, currentMediaIndex]);
  const displayName = useMemo(() => post.user.display_name || post.user.username || 'User', [post.user.display_name, post.user.username]);
  const timeAgo = useMemo(() => formatDistanceToNow(new Date(post.created_at), { addSuffix: true }), [post.created_at]);
  // Use video visibility hook for intersection observer
  const { containerRef, isVisible } = useVideoVisibility({
    threshold: 0.5,
    videoRef,
    shouldAutoplay: true,
    globallyMuted: isGloballyMuted,
    onEnterView: () => {
      if (videoRef.current && currentMedia?.media_type === 'video') {
        pauseAllOtherVideos(post.id);
      }
    }
  });

  // Register/unregister video with playback manager
  useEffect(() => {
    if (videoRef.current && currentMedia?.media_type === 'video') {
      registerVideo(post.id, videoRef.current);
      return () => unregisterVideo(post.id);
    }
  }, [post.id, currentMedia?.media_type, registerVideo, unregisterVideo]);

  // Swipe handlers for media navigation
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


  const handleProfileClick = useCallback(() => {
    navigate(`/profile/${post.user.username}`);
  }, [navigate, post.user.username]);

  const handleMediaClick = () => {
    openPostViewer(post, allUserPosts);
  };

  const handleVideoToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
  };

  if (!currentMedia) return null;

  return (
    <>
      <div 
        ref={containerRef}
        className="relative w-full bg-media-loading" 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
      >
        {/* Media Container - Full width, responsive height */}
        <div 
          {...swipeHandlers}
          className="relative w-full aspect-[4/5] md:aspect-[3/4]" 
        >
          {currentMedia.media_type === 'video' ? (
            <EnhancedVideoPlayer
              src={currentMedia.media_url}
              className="w-full h-full object-cover"
              autoplay={true}
              muted={true}
              loop={true}
              enableHLS={true}
            />
          ) : (
            <SmartMediaContainer
              media={[{
                id: currentMedia.id,
                type: 'image',
                url: currentMedia.media_url,
                alt: 'Post content'
              }]}
              className="w-full h-full cursor-pointer"
              priority={true}
            />
          )}

          {/* User Info Overlay - Top Left - Streamlined */}
          <div className="absolute top-3 left-2.5 flex items-center space-x-2 z-20">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-1.5 flex items-center space-x-2 max-w-[140px]">
              <OptimizedAvatar
                src={post.user.profile_photo_url}
                alt={displayName}
                className="w-6 h-6 border border-white/20 cursor-pointer flex-shrink-0"
                size={24}
                priority={true}
                fallback={displayName?.charAt(0)}
              />
              <div className="text-white text-xs min-w-0">
                <div 
                  className="font-semibold cursor-pointer hover:opacity-80 leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileClick();
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


          {/* Video Controls */}
          {currentMedia.media_type === 'video' && (
            <>
              {/* Play/Pause Center Button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
                  onClick={handleVideoToggle}
                >
                  {isVideoPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
              </div>

              {/* Mute/Unmute - Top Right Corner */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 z-20"
                onClick={handleMuteToggle}
              >
                {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </>
          )}

          {/* Multi-image navigation - only show arrows on desktop */}
          {post.post_media.length > 1 && (
            <>
              {!isMobile && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 z-20"
                    onClick={handlePrevMedia}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 z-20"
                    onClick={handleNextMedia}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Dots indicator */}
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
            </>
          )}

          {/* Engagement Icons - Bottom Right */}
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
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
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

        {/* Caption & Comments Area - Below Media */}
        {post.content && removeGolfCourseFromContent(post.content) && (
          <div className="bg-background p-4 border-b">
            <div className="text-sm">
              <div className="mb-1">
                <span className="font-semibold cursor-pointer hover:opacity-80" onClick={handleProfileClick}>
                  {displayName}
                </span>
                <span className="text-muted-foreground text-xs ml-1">
                  · {timeAgo}
                </span>
              </div>
              <div>{removeGolfCourseFromContent(post.content)}</div>
            </div>
            
            {/* Mock comments - in a real app this would come from a comments API */}
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div>View all comments</div>
            </div>
          </div>
        )}
      </div>

      {/* Post Viewer Modal */}
      {currentPost && (
        <PostViewerModal
          isOpen={isOpen}
          onClose={closePostViewer}
          initialPost={currentPost}
          allUserPosts={viewerPosts}
        />
      )}
    </>
  );
};

const InstagramStylePost = memo(InstagramStylePostComponent);
export default InstagramStylePost;