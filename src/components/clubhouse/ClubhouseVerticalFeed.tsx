import React, { useState, useEffect, useRef, useCallback } from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import { MapPin, UserPlus, UserCheck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeartIcon, ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon, SpeakerXMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { EmojiReactionTray } from './EmojiReactionTray';
import { usePostReactions } from '@/hooks/usePostReactions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import ClubTagPill from './ClubTagPill';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import CommentsModal from '@/components/posts/CommentsModal';
import { useVideoManager } from '@/contexts/VideoManagerContext';
import { AudioStrip } from './AudioStrip';
import PostMetadata from './PostMetadata';
import EngagementRail from './EngagementRail';

interface ClubhouseVerticalFeedProps {
  posts: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onCurrentPostChange?: (index: number) => void;
}

// VideoWithAutoplay component moved outside to prevent recreation on re-renders
const VideoWithAutoplay: React.FC<{
  src: string;
  muted: boolean;
  className: string;
  isMobile?: boolean;
  shouldAttach?: boolean;
  autoplay?: boolean;
}> = React.memo(({ src, muted, className, isMobile: isMobileProp = false, shouldAttach = false, autoplay = false }) => {
  // Generate HLS URL from source
  const uid = uidFromNode({ src });
  const hlsUrl = uid ? `https://videodelivery.net/${uid}/manifest/video.m3u8` : null;
  const poster = uid ? `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?height=600` : undefined;

  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  return (
    <div className="bg-black flex items-center justify-center w-full h-full relative">
      {/* Readability gradient - 35% height from bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: '35vh',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)'
        }}
      />
      
      {hlsUrl ? (
        <HLSVideoCard
          hlsUrl={hlsUrl}
          poster={poster}
          className="w-full h-full fullscreenVideoStage"
          aspectRatio="auto"
          muted={muted}
          loop={true}
          autoplay={autoplay}
          shouldAttach={shouldAttach}
          showMuteButton={false}
          externallyManaged={true}
          fit="cover"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Invalid video source</span>
        </div>
      )}
    </div>
  );
});

VideoWithAutoplay.displayName = 'VideoWithAutoplay';

const ClubhouseVerticalFeed: React.FC<ClubhouseVerticalFeedProps> = ({
  posts,
  onLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onCurrentPostChange
}) => {
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const { setActiveVideo } = useVideoManager();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  // Removed isTextExpanded state as mouse handlers were removed to prevent re-renders
  const [mediaIndices, setMediaIndices] = useState<{[key: string]: number}>({});
  const queryClient = useQueryClient();
  
  // Two-observer system for prebuffer and autoplay
  const nearRef = useRef<IntersectionObserver | null>(null);
  const playRef = useRef<IntersectionObserver | null>(null);
  const [shouldAttachMap, setShouldAttachMap] = useState<Record<string, boolean>>({});
  const [autoplayMap, setAutoplayMap] = useState<Record<string, boolean>>({});
  
  // Post reactions
  const { getUserReaction, handleReaction } = usePostReactions();
  const [showReactionTray, setShowReactionTray] = useState(false);
  const [reactionTrayPosition, setReactionTrayPosition] = useState({ x: 0, y: 0 });
  const [reactionPostId, setReactionPostId] = useState<string>('');
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Setup dual intersection observers
  useEffect(() => {
    nearRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-postid');
          if (!id) return;
          setShouldAttachMap((m) => ({ ...m, [id]: e.isIntersecting || e.intersectionRatio > 0 }));
        });
      },
      { root: null, rootMargin: '300px 0px 300px 0px', threshold: 0 }
    );

    playRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.getAttribute('data-postid');
          if (!id) return;
          setAutoplayMap((m) => ({ ...m, [id]: e.intersectionRatio >= 0.65 }));
        });
      },
      { root: null, threshold: [0.0, 0.65, 1.0] }
    );

    return () => {
      nearRef.current?.disconnect();
      playRef.current?.disconnect();
    };
  }, []);

  // Notify parent component when current post changes
  useEffect(() => {
    onCurrentPostChange?.(currentIndex);
  }, [currentIndex, onCurrentPostChange]);

  // Check which posts the user has liked
  const { data: likedPosts } = useQuery({
    queryKey: ['post-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const postIds = posts.map(post => post.id);
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      if (error) {
        console.error('Error fetching liked posts:', error);
        return [];
      }
      
      return data.map(like => like.post_id);
    },
    enabled: !!user?.id && posts.length > 0
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

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (action === 'like') {
        const { data, error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      // Update the liked posts cache
      queryClient.setQueryData(['post-likes', user?.id], (oldData: string[] | undefined) => {
        if (!oldData) return variables.action === 'like' ? [variables.postId] : [];
        
        if (variables.action === 'like') {
          return [...oldData, variables.postId];
        } else {
          return oldData.filter(id => id !== variables.postId);
        }
      });
    },
    onError: (error) => {
      console.error('Like/unlike error:', error);
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

  const handleLike = (postId: string) => {
    if (!user?.id) return;
    
    const isLiked = likedPosts?.includes(postId);
    likeMutation.mutate({
      postId,
      action: isLiked ? 'unlike' : 'like'
    });
  };

  // Helper function to truncate text to 9 words
  const truncateToWords = (text: string, wordLimit: number = 9) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Track previous scroll position for direction detection
  const prevScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);

  // Throttled scroll handler for better performance
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    // Immediate index update for responsiveness
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
      
      // If scrolling to a photo post, stop all videos
      const currentPost = posts[newIndex];
      if (currentPost && currentPost.type !== 'video') {
        setActiveVideo(null);
      }
    }

    // Debounced loading check to prevent excessive calls
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (newIndex >= posts.length - 3 && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    }, 150);

    prevScrollTopRef.current = scrollTop;
  }, [currentIndex, posts.length, hasMore, isLoadingMore, onLoadMore]);

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (!scrollViewRef.current) return;

    const itemHeight = window.innerHeight; // Full screen height now
    scrollViewRef.current.scrollTo({
      top: index * itemHeight,
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



  const handleShare = () => {
    console.log('Share clicked');
  };

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalOpen(true);
  };

  // Long press handlers for reaction tray
  const handleLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const newPosition = {
      x: rect.left - 80, // Position to the left of the button
      y: rect.top + rect.height / 2
    };
    
    setReactionTrayPosition(newPosition);
    setReactionPostId(postId);

    longPressTimer.current = setTimeout(() => {
      setShowReactionTray(true);
    }, 500); // 500ms long press threshold
  }, []);

  const handleLongPressEnd = useCallback((postId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!showReactionTray) {
      // Quick tap - toggle heart reaction
      const currentReaction = getUserReaction(postId);
      if (currentReaction === '❤️') {
        handleReaction(postId, ''); // Remove reaction
      } else {
        handleReaction(postId, '❤️'); // Add heart reaction
      }
    }
  }, [showReactionTray, getUserReaction, handleReaction]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const currentReaction = getUserReaction(reactionPostId);
    if (currentReaction === emoji) {
      handleReaction(reactionPostId, ''); // Remove reaction if same emoji selected
    } else {
      handleReaction(reactionPostId, emoji); // Set new reaction
    }
    setShowReactionTray(false);
  }, [reactionPostId, getUserReaction, handleReaction]);

  const handleReactionCancel = useCallback(() => {
    setShowReactionTray(false);
  }, []);

  if (posts.length === 0) {
    return <ClubhouzLoading />;
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
          scrollBehavior: isMobile ? 'auto' : 'smooth',
          overscrollBehavior: 'none',
          touchAction: 'pan-y'
        }}
      >

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
              key={item.id}
              data-postid={item.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current[index] = el;
                  nearRef.current?.observe(el);
                  playRef.current?.observe(el);
                }
              }}
              className="relative w-full snap-start snap-always"
              style={{ 
                height: '100vh', // Full screen height now that nav is transparent
                minHeight: '100vh',
                maxHeight: '100vh',
                width: '100vw',
                maxWidth: '100vw',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always'
              }}
            >
              {/* Media Content */}
              <div 
                onTouchStart={(e) => {
                  if (hasMultipleMedia) {
                    (e.currentTarget as any).touchStartX = e.touches[0].clientX;
                    (e.currentTarget as any).touchStartY = e.touches[0].clientY;
                  }
                }}
                onTouchEnd={(e) => {
                  if (!hasMultipleMedia) return;
                  
                  const touchEndX = e.changedTouches[0].clientX;
                  const touchEndY = e.changedTouches[0].clientY;
                  const touchStartX = (e.currentTarget as any).touchStartX || 0;
                  const touchStartY = (e.currentTarget as any).touchStartY || 0;
                  const deltaX = touchEndX - touchStartX;
                  const deltaY = touchEndY - touchStartY;
                  
                  // Only trigger swipe if horizontal movement is greater than vertical
                  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                      // Swipe right - previous media
                      setMediaIndices(prev => ({
                        ...prev,
                        [item.id]: currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItems.length - 1
                      }));
                    } else {
                      // Swipe left - next media
                      setMediaIndices(prev => ({
                        ...prev,
                        [item.id]: currentMediaIndex < mediaItems.length - 1 ? currentMediaIndex + 1 : 0
                      }));
                    }
                  }
                }}
                className="relative w-full h-full z-10"
                // Removed mouse enter/leave handlers that were causing re-renders
              >
                {currentMedia.media_type === 'video' ? (
                  <VideoWithAutoplay
                    src={currentMedia.media_url}
                    muted={isGloballyMuted}
                    className="w-full h-full"
                    isMobile={isMobile}
                    shouldAttach={!!shouldAttachMap[item.id]}
                    autoplay={!!autoplayMap[item.id]}
                  />
                ) : (
                  <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                    {/* Readability gradient for images too */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                      style={{
                        height: '35vh',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)'
                      }}
                    />
                    <img
                      src={currentMedia.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="eager" // Always load media to prevent grey placeholders
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

                {/* Navigation Arrows - Left and Right */}
                {hasMultipleMedia && (
                  <>
                    {/* Left Arrow */}
                    <button
                      onClick={handlePrevMedia}
                      className={`absolute ${isMobile ? 'left-4' : 'left-4'} top-1/2 -translate-y-1/2 z-30 p-0 transition-all duration-200 w-10 h-10 flex items-center justify-center`}
                      aria-label="Previous media"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>

                    {/* Right Arrow */}
                    <button
                      onClick={handleNextMedia}
                      className={`absolute ${isMobile ? 'right-4' : 'right-4'} top-1/2 -translate-y-1/2 z-30 p-0 transition-all duration-200 w-10 h-10 flex items-center justify-center`}
                      aria-label="Next media"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}
              </div>

              {/* Club Tag Pill - Positioned above content */}
              {item.golfCourse && (
                <ClubTagPill 
                  course={{
                    id: item.golfCourse.id,
                    name: item.golfCourse.name,
                    country: item.golfCourse.country
                  }}
                />
              )}

              {/* Post Metadata - Bottom Left */}
              <PostMetadata
                title={removeGolfCourseFromContent(item.title)}
                description={item.ctaDescription}
                user={{
                  name: item.user?.name || 'Unknown User',
                  avatar: item.user?.avatar
                }}
              />

              {/* Audio Strip - Only show for video posts with custom audio */}
              {currentMedia.media_type === 'video' && item.audioTrack && !item.audioTrack.isOriginal && (
                <div className="absolute bottom-20 left-4 md:left-8 z-20">
                  <AudioStrip audioTrack={item.audioTrack} />
                </div>
              )}

              {/* Engagement Rail - Bottom Right */}
              <EngagementRail
                postId={item.id}
                stats={{
                  likes: item.likes || 0,
                  comments: item.comments || 0,
                  shares: item.shares || 0,
                  bookmarks: 0
                }}
                isLiked={likedPosts?.includes(item.id)}
                onLike={() => handleLike(item.id)}
                onComment={() => handleComment(item.id)}
                onShare={handleShare}
                onBookmark={() => {/* TODO: implement bookmark */}}
              />
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

      {/* Comments Modal */}
      <CommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        postId={selectedPostId}
      />

      {/* Emoji Reaction Tray */}
      <EmojiReactionTray
        isVisible={showReactionTray}
        onEmojiSelect={handleEmojiSelect}
        onCancel={handleReactionCancel}
        position={reactionTrayPosition}
        selectedEmoji={getUserReaction(reactionPostId)}
      />

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
          scroll-snap-type: y mandatory;
          will-change: scroll-position;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .snap-y::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .snap-start {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          will-change: transform;
        }
        @media (max-width: 768px) {
          .snap-y {
            scroll-behavior: auto !important;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: none;
            overscroll-behavior-y: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ClubhouseVerticalFeed;