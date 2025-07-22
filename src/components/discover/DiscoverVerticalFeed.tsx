import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, UserPlus, UserCheck, Loader2, Minimize2 } from 'lucide-react';
import { PaperAirplaneIcon, HeartIcon, SpeakerXMarkIcon, SpeakerWaveIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useVideoManager } from '@/contexts/VideoManagerContext';

interface DiscoverVerticalFeedProps {
  isOpen: boolean;
  onClose: () => void;
  posts: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onScroll?: (scrollDirection: 'up' | 'down') => void;
  initialItem?: ExploreContentItem;
}

// VideoWithAutoplay component moved outside to prevent recreation on re-renders
const VideoWithAutoplay: React.FC<{
  src: string;
  muted: boolean;
  className: string;
}> = React.memo(({ src, muted, className }) => {
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intersectionRef = useRef<HTMLVideoElement | null>(null);
  const { setActiveVideo, addVideo, removeVideo } = useVideoManager();
  const { isGloballyMuted } = useGlobalAudio();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Use intersection observer with proper typing
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const newIsInView = entry.isIntersecting && entry.intersectionRatio >= 0.8;
        setIsInView(newIsInView);
        
        // Reset hasAttemptedPlay when video goes out of view
        if (!newIsInView) {
          setHasAttemptedPlay(false);
        }
      },
      {
        threshold: 0.8,
        rootMargin: '0px'
      }
    );

    const currentRef = intersectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Register video with manager when component mounts
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        removeVideo(videoRef.current);
      }
    };
  }, [removeVideo]);

  // Combined ref callback
  const combinedRef = useCallback((node: HTMLVideoElement | null) => {
    if (videoRef.current) {
      removeVideo(videoRef.current);
    }
    
    videoRef.current = node;
    intersectionRef.current = node;
    
    if (node) {
      addVideo(node);
    }
  }, [addVideo, removeVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInView || hasAttemptedPlay) return;

    const attemptPlay = async () => {
      try {
        setHasAttemptedPlay(true);
        
        // Set video as active in manager
        setActiveVideo(video);
        
        video.muted = isGloballyMuted;
        video.currentTime = 0;
        await video.play();
      } catch (error) {
        console.warn('Video autoplay failed:', error);
      }
    };

    // Delay to ensure proper intersection detection
    const timer = setTimeout(attemptPlay, 100);
    return () => clearTimeout(timer);
  }, [isInView, hasAttemptedPlay, isGloballyMuted, setActiveVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = muted;
  }, [muted]);

  // Reset hasAttemptedPlay when src changes
  useEffect(() => {
    setHasAttemptedPlay(false);
  }, [src]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <EnhancedVideoPlayer
        ref={combinedRef}
        src={src}
        autoplay={false}
        muted={muted}
        loop={true}
        className="w-full h-full"
        enableHLS={true}
        preloadLevel="metadata"
        poster=""
      />
    </div>
  );
});

VideoWithAutoplay.displayName = 'VideoWithAutoplay';

const DiscoverVerticalFeed: React.FC<DiscoverVerticalFeedProps> = ({
  isOpen,
  onClose,
  posts,
  onLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onScroll,
  initialItem
}) => {
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const queryClient = useQueryClient();

  // Hide header when modal opens, show when closed
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      if (isOpen) {
        header.style.display = 'none';
      } else {
        header.style.display = '';
      }
    }

    // Cleanup: ensure header is shown when component unmounts
    return () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.display = '';
      }
    };
  }, [isOpen]);

  // Find initial index when modal opens
  useEffect(() => {
    if (isOpen && initialItem && posts.length > 0) {
      const index = posts.findIndex(post => post.id === initialItem.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [isOpen, initialItem, posts]);

  // Check if current user follows the displayed user
  const { data: isFollowing, isLoading: isFollowingLoading } = useQuery({
    queryKey: ['user-follows', user?.id, posts[currentIndex]?.user?.id],
    queryFn: async () => {
      if (!user?.id || !posts[currentIndex]?.user?.id || user.id === posts[currentIndex]?.user?.id) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', posts[currentIndex]?.user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!posts[currentIndex]?.user?.id && user.id !== posts[currentIndex]?.user?.id
  });

  // Check if current user has liked the displayed post
  const { data: likedPosts } = useQuery({
    queryKey: ['user-post-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return data.map(like => like.post_id);
    },
    enabled: !!user?.id
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, shouldFollow }: { targetUserId: string; shouldFollow: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (shouldFollow) {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-follows', user?.id, posts[currentIndex]?.user?.id] });
    }
  });

  const toggleGlobalMute = useCallback(() => {
    setGlobalMute(!isGloballyMuted);
  }, [isGloballyMuted, setGlobalMute]);

  const handleLike = useCallback((postId: string) => {
    onLike(postId);
  }, [onLike]);

  const handleFollow = useCallback(() => {
    const targetUser = posts[currentIndex]?.user;
    if (!targetUser?.id || !user?.id || targetUser.id === user.id) return;
    
    followMutation.mutate({
      targetUserId: targetUser.id,
      shouldFollow: !isFollowing
    });
  }, [followMutation, posts, currentIndex, user?.id, isFollowing]);

  const handleComment = useCallback(() => {
    // TODO: Open comments modal
    console.log('Comment clicked for post:', posts[currentIndex]?.id);
  }, [posts, currentIndex]);

  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    console.log('Share clicked for post:', posts[currentIndex]?.id);
  }, [posts, currentIndex]);

  // Function to truncate words properly
  const truncateToWords = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const scrollTop = element.scrollTop;
    const itemHeight = element.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
      
      // Call onScroll callback if provided
      if (onScroll) {
        const direction = newIndex > currentIndex ? 'down' : 'up';
        onScroll(direction);
      }
    }

    // Load more when near the end
    if (hasMore && !isLoadingMore && newIndex >= posts.length - 3) {
      onLoadMore();
    }
  }, [currentIndex, posts.length, onScroll, hasMore, isLoadingMore, onLoadMore]);

  // Navigate to specific index
  const navigateToIndex = useCallback((index: number) => {
    if (index >= 0 && index < posts.length && scrollViewRef.current) {
      const element = scrollViewRef.current;
      const targetScrollTop = index * element.clientHeight;
      element.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      setCurrentIndex(index);
    }
  }, [posts.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            navigateToIndex(currentIndex - 1);
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < posts.length - 1) {
            navigateToIndex(currentIndex + 1);
          }
          break;
        case ' ':
          event.preventDefault();
          toggleGlobalMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentIndex, posts.length, navigateToIndex, toggleGlobalMute]);

  if (!isOpen) return null;

  if (posts.length === 0) {
    return (
      <div className="fixed inset-0 z-10 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f7931e' }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10 bg-black overflow-hidden">
      {/* Scrollable Content */}
      <div 
        ref={scrollViewRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {posts.map((item, index) => {
          return (
            <div 
              key={`${item.id}-${index}`}
              ref={(el) => {
                if (el) itemRefs.current[index] = el;
              }}
              className="relative w-full snap-start snap-always flex items-center justify-center"
              style={{ 
                height: '100vh',
                minHeight: '100vh',
                maxHeight: '100vh'
              }}
            >
              {/* Close Button - Top Right */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-30 p-0 rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <Minimize2 className="w-8 h-8" />
              </button>

              {/* User Info - Top Left */}
              <div className="absolute top-6 left-6 z-20 flex items-center space-x-3">
                <img
                  src={posts[currentIndex]?.user?.avatar || '/placeholder.svg'}
                  alt={posts[currentIndex]?.user?.name || 'User'}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {posts[currentIndex]?.user?.name || 'Unknown User'}
                  </span>
                  {posts[currentIndex]?.user?.username && (
                    <span className="text-sm text-white/70" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                      @{posts[currentIndex]?.user?.username}
                    </span>
                  )}
                </div>
                
                {/* Follow Button - Next to user info */}
                {user?.id && posts[currentIndex]?.user?.id && user.id !== posts[currentIndex]?.user?.id && (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowingLoading || followMutation.isPending}
                    className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white hover:bg-white/30 transition-colors disabled:opacity-50 ml-3"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-medium">Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-medium">Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Media Content */}
              <div 
                className="relative w-full h-full flex items-center justify-center"
              >
                {item.type === 'video' ? (
                  <VideoWithAutoplay
                    src={item.src}
                    muted={isGloballyMuted}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-contain"
                      loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Golf Course Badge and Caption - Bottom Left */}
              <div className="absolute bottom-24 left-3 right-20 z-20">
                {/* Golf Course Badge - Above Caption */}
                {item.golfCourse && (
                  <div className="mb-2">
                     {isMobile ? (
                       <div className="inline-flex items-center bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                         <MapPin className="w-4 h-4 text-white mr-2" />
                         {item.golfCourse.name}
                       </div>
                     ) : (
                       <div className="inline-flex items-center bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                         <MapPin className="w-5 h-5 text-white mr-2" />
                         {item.golfCourse.name}
                       </div>
                     )}
                   </div>
                )}

                {/* Caption Text */}
                {item.title && removeGolfCourseFromContent(item.title) && (
                  <div 
                    className="text-white text-base font-medium leading-[1.4] cursor-default"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                  >
                    <div className="transition-all duration-300 ease-in-out whitespace-normal">
                      <span className="text-base font-medium">
                        {/* Show truncated text on mobile, full text on desktop */}
                        {isMobile 
                          ? truncateToWords(removeGolfCourseFromContent(item.title), 12)
                          : removeGolfCourseFromContent(item.title)
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Bottom Right */}
              <div className="absolute bottom-24 right-4 z-10 flex flex-col space-y-6">
                {/* Mute/Unmute Button */}
                <button
                  onClick={toggleGlobalMute}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  aria-label={isGloballyMuted ? "Unmute" : "Mute"}
                >
                  {isGloballyMuted ? (
                    <SpeakerXMarkIcon className="w-8 h-8 text-white" />
                  ) : (
                    <SpeakerWaveIcon className="w-8 h-8 text-white" />
                  )}
                </button>

                {/* Like Button */}
                <button
                  onClick={() => handleLike(item.id)}
                  className="cursor-pointer hover:opacity-100 transition-opacity flex flex-col items-center"
                  aria-label="Like"
                >
                  <HeartIcon 
                    className={`h-8 w-8 ${likedPosts?.includes(item.id) ? 'text-red-500 fill-red-500' : 'text-white'}`} 
                  />
                  <span className="text-white text-sm font-medium mt-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {Math.floor(Math.random() * 1000) + 10}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={handleComment}
                  className="cursor-pointer hover:opacity-100 transition-opacity flex flex-col items-center"
                  aria-label="Comment"
                >
                  <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8 text-white" />
                  <span className="text-white text-sm font-medium mt-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {Math.floor(Math.random() * 50) + 5}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  aria-label="Share"
                >
                  <PaperAirplaneIcon className="h-8 w-8 text-white" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="h-screen flex items-center justify-center">
          <div className="text-white/70">Loading more posts...</div>
        </div>
      )}

      <style>{`
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .snap-y {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .snap-y::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default DiscoverVerticalFeed;