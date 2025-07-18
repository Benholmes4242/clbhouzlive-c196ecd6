import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share, Volume2, VolumeX, MapPin, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface ClubhouseVerticalFeedProps {
  posts: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const ClubhouseVerticalFeed: React.FC<ClubhouseVerticalFeedProps> = ({
  posts,
  onLike,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [mediaIndices, setMediaIndices] = useState<{[key: string]: number}>({});
  const queryClient = useQueryClient();

  // VideoWithAutoplay component using intersection observer
  const VideoWithAutoplay: React.FC<{
    src: string;
    muted: boolean;
    className: string;
  }> = ({ src, muted, className }) => {
    const { ref, isInView } = useIntersectionObserver({
      threshold: 0.5, // Video must be 50% visible to autoplay
      rootMargin: '0px'
    });
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

    useEffect(() => {
      if (!ref.current || !isInView) return;
      
      // Find the video element within the container
      const video = ref.current.querySelector('video');
      if (video && video !== videoElement) {
        setVideoElement(video);
      }
    }, [ref.current, isInView, videoElement]);

    useEffect(() => {
      if (!videoElement) return;

      if (isInView) {
        videoElement.play().catch(console.error);
      } else {
        videoElement.pause();
      }
    }, [isInView, videoElement]);

    return (
      <div ref={ref} className="relative w-full h-full bg-media-loading">
        <EnhancedVideoPlayer
          src={src}
          autoplay={false} // We handle autoplay manually
          muted={muted}
          loop={true}
          className={className}
          enableHLS={true}
        />
      </div>
    );
  };

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
        console.error('Error checking follow status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!posts[currentIndex]?.user?.id && user.id !== posts[currentIndex]?.user?.id
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, action }: { targetUserId: string; action: 'follow' | 'unfollow' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (action === 'follow') {
        const { data, error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ['user-follows', user?.id, variables.targetUserId],
        variables.action === 'follow'
      );
    },
    onError: (error) => {
      console.error('Follow/unfollow error:', error);
    }
  });

  const handleFollowToggle = () => {
    const targetUserId = posts[currentIndex]?.user?.id;
    if (!targetUserId || !user?.id || targetUserId === user.id) return;
    
    followMutation.mutate({
      targetUserId,
      action: isFollowing ? 'unfollow' : 'follow'
    });
  };

  // Helper function to truncate text to 9 words
  const truncateToWords = (text: string, wordLimit: number = 9) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Handle scroll to snap to items
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    // Calculate heights dynamically based on current post type
    let accumulatedHeight = 0;
    let newIndex = 0;
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const mediaItems = post.media && post.media.length > 0 ? post.media : [{
        media_type: post.type as 'video' | 'image'
      }];
      const currentMedia = mediaItems[0];
      const itemHeight = currentMedia.media_type === 'video' ? 
        (window.innerHeight - 64) : (window.innerHeight - 128);
      
      if (scrollTop < accumulatedHeight + itemHeight) {
        newIndex = i;
        break;
      }
      accumulatedHeight += itemHeight;
    }
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
      
      // Load more posts when near the end
      if (newIndex >= posts.length - 3 && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    }
  }, [currentIndex, posts.length, hasMore, isLoadingMore, onLoadMore]);

  // Scroll to specific index with dynamic heights
  const scrollToIndex = (index: number) => {
    if (!scrollViewRef.current) return;

    let accumulatedHeight = 0;
    for (let i = 0; i < index; i++) {
      const post = posts[i];
      const mediaItems = post.media && post.media.length > 0 ? post.media : [{
        media_type: post.type as 'video' | 'image'
      }];
      const currentMedia = mediaItems[0];
      const itemHeight = currentMedia.media_type === 'video' ? 
        (window.innerHeight - 64) : (window.innerHeight - 128);
      accumulatedHeight += itemHeight;
    }

    scrollViewRef.current.scrollTo({
      top: accumulatedHeight,
      behavior: 'smooth'
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            scrollToIndex(newIndex);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < posts.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            scrollToIndex(newIndex);
            
            // Load more if near end
            if (newIndex >= posts.length - 3 && hasMore && !isLoadingMore) {
              onLoadMore();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length, hasMore, isLoadingMore, onLoadMore]);


  const handleLike = (item: ExploreContentItem) => {
    onLike(item.id);
  };

  const handleShare = () => {
    console.log('Share clicked');
  };

  const handleComment = () => {
    console.log('Comment clicked');
  };

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
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {/* User Profile - Top Left */}
        <div className="absolute top-4 left-4 z-30 flex items-center space-x-3">
          {/* Profile Photo */}
          <div className="relative">
            <img
              src={posts[currentIndex]?.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={posts[currentIndex]?.user?.name || 'User'}
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
              }}
            />
          </div>
          
          {/* Username */}
          <div className="flex items-center gap-3">
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
            
            {/* Follow pill - only show if not own post and user is logged in */}
            {user?.id && posts[currentIndex]?.user?.id && user.id !== posts[currentIndex]?.user?.id && (
              <button 
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || isFollowingLoading}
                className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {posts.map((item, index) => {
          // Get media array for this item
          const mediaItems = item.media && item.media.length > 0 ? item.media : [{
            id: `${item.id}-single`,
            media_type: item.type as 'video' | 'image',
            media_url: item.src
          }];
          
          const currentMediaIndex = mediaIndices[item.id] || 0;
          const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];
          const hasMultipleMedia = mediaItems.length > 1;

          // Navigation handlers for this specific item
          const handlePrevMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItems.length - 1
            }));
          };

          const handleNextMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex < mediaItems.length - 1 ? currentMediaIndex + 1 : 0
            }));
          };

          return (
            <div
              key={`${item.id}-${index}`}
              ref={(el) => {
                if (el) itemRefs.current[index] = el;
              }}
              className="relative w-full snap-start snap-always flex items-center justify-center"
              style={{ 
                height: currentMedia.media_type === 'video' ? 'calc(100vh - 64px)' : 'calc(100vh - 128px)', // Different heights for video vs photo
                minHeight: currentMedia.media_type === 'video' ? 'calc(100vh - 64px)' : 'calc(100vh - 128px)',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always'
              }}
            >
              {/* Media Content */}
              <div 
                className="relative w-full h-full flex items-center justify-center"
                onMouseEnter={() => setIsTextExpanded(true)}
                onMouseLeave={() => setIsTextExpanded(false)}
              >
                {currentMedia.media_type === 'video' ? (
                  <VideoWithAutoplay
                    src={currentMedia.media_url}
                    muted={isGloballyMuted}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <img
                      src={currentMedia.media_url}
                      alt={item.title}
                      className="w-full h-full object-contain"
                      loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';
                      }}
                    />
                  </div>
                )}

                {/* Navigation Dots - Bottom Center */}
                {hasMultipleMedia && (
                  <MediaNavigationDots
                    mediaCount={mediaItems.length}
                    currentIndex={currentMediaIndex}
                  />
                )}
              </div>

              {/* Caption and Golf Course Tag - Bottom Left */}
              <div className="absolute bottom-5 left-3 right-20 z-20">
                {/* Golf Course Badge - Above Caption */}
                {item.golfCourse && (
                  <div className="mb-2">
                    {isMobile ? (
                      <div className="flex items-center">
                        <button className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-2 transition-all duration-200">
                          <MapPin className="w-4 h-4 text-white" />
                        </button>
                        <div className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                          {item.golfCourse.name}
                        </div>
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
                    className="text-white text-base font-bold leading-[1.4] cursor-default"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                  >
                    <div className="transition-all duration-300 ease-in-out whitespace-normal">
                      <span className="text-base font-bold">
                        {isTextExpanded 
                          ? removeGolfCourseFromContent(item.title)
                          : truncateToWords(removeGolfCourseFromContent(item.title), 9)
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Bottom Right */}
              <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-8">
                {/* Mute/Unmute toggle button - only show for video posts */}
                {currentMedia.media_type === 'video' && (
                  <button 
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={() => setGlobalMute(!isGloballyMuted)}
                  >
                    {isGloballyMuted ? (
                      <VolumeX className="w-8 h-8 text-white" />
                    ) : (
                      <Volume2 className="w-8 h-8 text-white" />
                    )}
                  </button>
                )}

                {/* Heart Button */}
                <button
                  onClick={() => handleLike(item)}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                >
                  <Heart className="h-8 w-8 text-white" />
                </button>

                {/* Message Button */}
                <button
                  onClick={handleComment}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                >
                  <MessageCircle className="h-8 w-8 text-white" />
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                >
                  <Share className="h-8 w-8 text-white" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Loading indicator at the bottom */}
        {isLoadingMore && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-white/70">Loading more posts...</div>
          </div>
        )}
      </div>

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

export default ClubhouseVerticalFeed;